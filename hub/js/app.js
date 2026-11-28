// DUET STEM 360: the hub. Browse every DUET STEM activity, download the ones you want (Android app) and play them.
// Data: catalog.json (devtools/hub/catalog.mjs) and packs.json (devtools/hub/packs.mjs). No 3D on these pages.
import { t, L, LANGS } from './strings.js';
import { makeStore } from './store.js';
import { initNav } from './nav.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const Q = new URLSearchParams(location.search);
const keep = { get(k, d) { try { const v = localStorage.getItem('hub.' + k); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('hub.' + k, v); } catch (e) { /* private window */ } } };
const st = { lang: Q.get('lang') || keep.get('lang', 'en'), mode: Q.get('mode') || keep.get('mode', 'screen'), cls: keep.get('cls', ''), subj: keep.get('subj', ''), tab: 'home', last: '#home' };
if (!LANGS.some(([k]) => k === st.lang)) st.lang = 'en';
let CAT, ITEMS, BY, PACKS = null, STORE, MODES, MODE_BY, SUBJ_BY, TABMODES;

// ------------------------------------------------------------------ icons (line icons, 24×24)
const P = {
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  flask: '<path d="M9.5 3.5h5"/><path d="M10.5 3.5v5.2L5 18.3A1.6 1.6 0 0 0 6.4 20.6h11.2a1.6 1.6 0 0 0 1.4-2.3l-5.5-9.6V3.5"/><path d="M7.4 14.5h9.2"/>',
  cube: '<path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z"/><path d="M12 12 20 7.5M12 12 4 7.5M12 12v9"/>',
  download: '<path d="M12 4v11"/><path d="m7.5 10.8 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>',
  more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
  phone: '<rect x="6.5" y="2.8" width="11" height="18.4" rx="2.2"/><path d="M10.5 18h3"/>',
  vrbox: '<path d="M3 8.5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v6.6c0 1.1-.9 2-2 2h-4l-1.6-2.4a1.6 1.6 0 0 0-2.8 0L9 17.1H5c-1.1 0-2-.9-2-2z"/><circle cx="8" cy="11.5" r="1.6"/><circle cx="16" cy="11.5" r="1.6"/>',
  headset: '<path d="M2.8 9.5C2.8 8 4 7 5.5 7h13c1.5 0 2.7 1 2.7 2.5v4.4c0 1.4-1.1 2.6-2.6 2.6h-3.2l-1.7-2a2.2 2.2 0 0 0-3.4 0l-1.7 2H5.4c-1.5 0-2.6-1.2-2.6-2.6z"/><path d="M5 7 6.8 4.5h10.4L19 7"/>',
  panel: '<rect x="2.5" y="4" width="19" height="12.5" rx="1.5"/><path d="M8.5 20h7M12 16.5V20"/>',
  pad: '<path d="m3 15 9 4.5 9-4.5-9-4.5z"/><path d="M12 10.5V4"/><path d="m9.5 6.5 2.5-2.5 2.5 2.5"/>',
  glasses: '<circle cx="6.5" cy="13.5" r="3.5"/><circle cx="17.5" cy="13.5" r="3.5"/><path d="M10 13.5h4M3 13l1.5-5.5M21 13l-1.5-5.5"/>',
  gyro: '<rect x="8" y="5" width="8" height="14" rx="1.8"/><path d="M4.5 8.5a9 9 0 0 0 0 7M19.5 8.5a9 9 0 0 1 0 7"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  play: '<path d="M7.5 5.2v13.6a.8.8 0 0 0 1.2.7l11-6.8a.8.8 0 0 0 0-1.4l-11-6.8a.8.8 0 0 0-1.2.7z"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6"/><path d="M6.5 7l.9 12.2c.1 1 .9 1.8 1.9 1.8h5.4c1 0 1.8-.8 1.9-1.8L17.5 7"/><path d="M9.5 7V4.5h5V7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  right: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5V9H15"/>',
  atom: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
  leaf: '<path d="M5 19c0-8 5-13.5 14-14-0.5 9-6 14-14 14z"/><path d="M5 19 13 11"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  ruler: '<path d="m3.5 15.5 12-12 5 5-12 12z"/><path d="m7.5 11.5 2 2M10.5 8.5l2 2M13.5 5.5l2 2"/>',
  planet: '<circle cx="12" cy="12" r="5.5"/><path d="M3.2 15.5c-1.4 2 2.6 2.6 8.8.2s9.6-5.6 8.8-7.6c-.4-1-2.3-1.1-4.8-.4"/>',
  chip: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/><path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21"/>',
};
const ic = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || P.cube}</svg>`;
const SUBJ_ICON = { physics: 'atom', chemistry: 'flask', biology: 'leaf', body: 'heart', maths: 'ruler', space: 'planet', robotics: 'chip' };

// ------------------------------------------------------------------ helpers
const fmtB = (b) => (b >= 1e9 ? t('gb', st.lang, { n: (b / 1e9).toFixed(1) }) : t('mb', st.lang, { n: b >= 1e8 ? Math.round(b / 1e6) : (b / 1e6).toFixed(b < 1e5 && b > 0 ? 2 : 1) }));
const subjName = (id) => L(SUBJ_BY[id] && SUBJ_BY[id].name, st.lang);
const subjColor = (id) => (SUBJ_BY[id] && SUBJ_BY[id].color) || '#888';
const clsLabel = (it) => { const c = [...it.classes].sort((a, b) => a - b); const r = c.length > 2 && c[c.length - 1] - c[0] === c.length - 1 ? `${c[0]}–${c[c.length - 1]}` : c.join(', '); return t('cls', st.lang, { n: r }); };
const matchCls = (it) => !st.cls || (st.cls === '3-5' ? it.classes.some((c) => c <= 5) : it.classes.includes(+st.cls));
const matchMode = (it) => it.modes.includes(st.mode);
const filtered = (list, { subj = true } = {}) => list.filter((it) => matchMode(it) && matchCls(it) && (!subj || !st.subj || it.subject === st.subj));
const TYPES_EXP = new Set(['experiment', 'lesson', 'simulator']);

function thumbHTML(it, extra = '') {
  const ph = `<span class="ph" style="--sub:${subjColor(it.subject)}">${ic(SUBJ_ICON[it.subject])}</span>`;
  const img = it.thumb ? `<img src="${esc(it.thumb)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : '';
  return `<span class="thumb">${ph}${img}${extra}</span>`;
}
function stateBadge(it) {
  const s = STORE.state(it.id);
  if (s === 'ready' || s === 'inapp' && STORE.native) return `<span class="st ok">${ic('check')}</span>`;
  if (s === 'downloading' || s === 'queued' || s === 'waiting') { const p = STORE.progress(it.id); return `<span class="st dl">${ic('download')}${p && p.total ? Math.floor((100 * p.done) / p.total) + '%' : ''}</span>`; }
  return '';
}
function card(it) {
  const modes = it.modes.filter((m) => MODE_BY[m] && (MODE_BY[m].tab || MODE_BY[m].planned)).slice(0, 4).map((m) => `<span title="${esc(L(MODE_BY[m].name, st.lang))}">${ic(MODE_BY[m].icon)}</span>`).join('');
  const p = STORE.progress(it.id); const bar = p ? `<span class="bar"><i style="width:${p.total ? (100 * p.done) / p.total : 0}%"></i></span>` : '';
  const s = STORE.state(it.id);
  const right = it.free && !STORE.native ? `<span class="sz free">${esc(t('free', st.lang))}</span>` : STORE.native && s === 'none' && it.bytes ? `<span class="sz">${fmtB(it.bytes)}</span>` : it.free ? `<span class="sz free">${esc(t('free', st.lang))}</span>` : '';
  return `<button class="card" type="button" data-id="${esc(it.id)}" style="--sub:${subjColor(it.subject)}">${thumbHTML(it, `<span class="badge">${esc(t('t_' + it.type, st.lang))}</span>${stateBadge(it)}<span class="modes">${modes}</span>${bar}`)}<span class="cb"><span class="ct">${esc(L(it.title, st.lang))}</span><span class="cm"><i></i><span class="l">${esc(clsLabel(it))} · ${esc(subjName(it.subject))}</span>${right}</span></span></button>`;
}
function filtersHTML(withSubj = true) {
  const cls = [['', t('allClasses', st.lang)], ['3-5', t('cls', st.lang, { n: '3–5' })], ...[6, 7, 8, 9, 10].map((c) => [String(c), t('cls', st.lang, { n: c })])];
  const subs = CAT.subjects.filter((s) => ITEMS.some((it) => it.subject === s.id && matchMode(it)));
  return `<div class="filters"><div class="chips" role="group" aria-label="${esc(t('classShort', st.lang))}">${cls.map(([k, n]) => `<button class="chip" type="button" data-cls="${k}" aria-pressed="${st.cls === k}">${esc(n)}</button>`).join('')}</div>`
    + (withSubj ? `<div class="chips" role="group">${[['', t('allSubjects', st.lang), '#888'], ...subs.map((s) => [s.id, L(s.name, st.lang), s.color])].map(([k, n, c]) => `<button class="chip" type="button" data-subj="${k}" aria-pressed="${st.subj === k}" style="--sub:${c}">${k ? '<i></i>' : ''}${esc(n)}</button>`).join('')}</div>` : '') + '</div>';
}
const order = (a, b) => (Math.min(...a.classes) - Math.min(...b.classes)) || 0;
function strip(title, sub, list, allHref, n) {
  if (!list.length) return '';
  return `<section class="sec"><div class="sech"><h2>${sub ? `<i style="--sub:${subjColor(sub)}"></i>` : ''}${esc(title)}</h2><span class="n">${esc(t('count', st.lang, { n: n ?? list.length }))}</span>${allHref ? `<a class="all" href="${allHref}">${esc(t('viewAll', st.lang))}${ic('right')}</a>` : ''}</div><div class="strip">${list.map(card).join('')}</div></section>`;
}

// ------------------------------------------------------------------ pages
const FEATURED = ['body.lab-heart', 'space.ch3', 'maths.w10_flagpole', 'science.bw9_reef_phyla', 'robotics.traffic', 'science.p10_prism', 'body.j-circulation', 'space.pad'];
function pageHome() {
  const list = filtered(ITEMS);
  const feat = [...FEATURED.map((id) => BY[id]).filter((it) => it && it.thumb), ...ITEMS.filter((it) => it.thumb)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
  const mname = L(MODE_BY[st.mode] && MODE_BY[st.mode].name, st.lang);
  let h = `<div class="hero"><div class="bg">${feat.map((it) => `<img src="${esc(it.thumb)}" alt="" decoding="async">`).join('')}</div><div class="txt"><h1>${esc(t('heroTitle', st.lang))}</h1><p>${esc(t(STORE.native ? 'heroText' : 'heroTextWeb', st.lang))}</p><span class="stat">${ic(MODE_BY[st.mode] ? MODE_BY[st.mode].icon : 'phone')}${esc(t('forMode', st.lang, { n: filtered(ITEMS, { subj: false }).filter(matchCls).length, m: mname }))}</span></div></div>`;
  h += filtersHTML();
  if (STORE.native) { const mine = STORE.downloaded().map((id) => BY[id]).filter(Boolean).filter((it) => matchMode(it)); h += strip(t('continue', st.lang), null, mine.slice(0, 16), '#downloads', mine.length); }
  for (const s of CAT.subjects) {
    if (st.subj && st.subj !== s.id) continue;
    const l = list.filter((it) => it.subject === s.id).sort(order);
    h += strip(L(s.name, st.lang), s.id, l.slice(0, 14), `#all/${s.id}`, l.length);
  }
  if (!list.length) h += `<div class="empty">${esc(t('noResults', st.lang))}</div>`;
  return h;
}
function gridPage(title, list, { groupBy = 'subject', back = false } = {}) {
  let h = `<div class="pageh">${back ? `<button class="back" type="button" data-back>${ic('left')}${esc(t('back', st.lang))}</button>` : ''}<h1>${esc(title)}</h1><span class="n">${esc(t('count', st.lang, { n: list.length }))}</span></div>`;
  h += filtersHTML(groupBy === 'subject');
  if (!list.length) return h + `<div class="empty">${esc(t('noResults', st.lang))}</div>`;
  const groups = new Map();
  for (const it of list) { const k = groupBy === 'class' ? Math.min(...it.classes) : it.subject; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); }
  const keys = [...groups.keys()]; if (groupBy === 'class') keys.sort((a, b) => a - b); else keys.sort((a, b) => CAT.subjects.findIndex((s) => s.id === a) - CAT.subjects.findIndex((s) => s.id === b));
  for (const k of keys) {
    const l = groups.get(k).sort(order);
    if (keys.length > 1) h += `<div class="group">${esc(groupBy === 'class' ? t('cls', st.lang, { n: k }) : subjName(k))} · ${l.length}</div>`;
    h += `<div class="grid">${l.map(card).join('')}</div>`;
  }
  return h;
}
const pageExp = () => gridPage(t('experiments', st.lang), filtered(ITEMS).filter((it) => TYPES_EXP.has(it.type)));
const pageModels = () => gridPage(t('models', st.lang), filtered(ITEMS).filter((it) => !TYPES_EXP.has(it.type)));
const pageAll = (s) => gridPage(subjName(s), filtered(ITEMS, { subj: false }).filter((it) => it.subject === s), { groupBy: 'class', back: true });
function norm(s) { return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, ''); }
function pageSearch(q) {
  const words = norm(q).split(/\s+/).filter(Boolean);
  const hay = (it) => it._hay || (it._hay = norm([it.title.en, it.title.hi, it.title.hg, it.desc.en, it.desc.hg, it.chapter && it.chapter.en, it.chapter && it.chapter.hi, it.kind && it.kind.en, subjName(it.subject), L(SUBJ_BY[it.subject].name, 'en'), L(SUBJ_BY[it.subject].name, 'hi'), it.type, CAT.apps[it.app] && CAT.apps[it.app].name.en].join(' ')));
  const list = words.length ? filtered(ITEMS).filter((it) => words.every((w) => hay(it).includes(w))) : [];
  list.sort((a, b) => (norm(L(b.title, st.lang)).includes(words[0] || '') ? 1 : 0) - (norm(L(a.title, st.lang)).includes(words[0] || '') ? 1 : 0));
  return `<div class="pageh"><h1>${esc(t('results', st.lang, { n: list.length, q }))}</h1></div>${filtersHTML()}` + (list.length ? `<div class="grid">${list.map(card).join('')}</div>` : `<div class="empty">${esc(t('noResults', st.lang))}</div>`);
}
function pageDownloads() {
  if (!STORE.native) {
    let h = `<div class="pageh"><h1>${esc(t('downloads', st.lang))}</h1></div><div class="panel"><p class="lead">${esc(t('webNote', st.lang))}</p></div>`;
    h += `<div class="panel"><h2>${esc(t('bySubject', st.lang))}</h2><div class="list">${CAT.subjects.map((s) => { const ids = ITEMS.filter((it) => it.subject === s.id).map((it) => it.id); return `<div class="subj" style="--sub:${s.color}"><span class="sn"><i></i>${esc(L(s.name, st.lang))} <small>${esc(t('count', st.lang, { n: ids.length }))}</small></span><span class="note">${fmtB(unionBytes(ids))}</span></div>`; }).join('')}</div><p class="note">${esc(t('bySubjectNote', st.lang))}</p></div>`;
    return h;
  }
  STORE.refresh();
  const mine = STORE.downloaded().map((id) => BY[id]).filter(Boolean);
  const act = STORE.activeIds().map((id) => BY[id]).filter(Boolean);
  const base = PACKS ? (() => { const u = new Set(); for (const a of Object.values(PACKS.apps)) for (const i of a.files) u.add(PACKS.files[i][1] + PACKS.files[i][2]); let b = 0; for (const k of u) b += +k.slice(12); return b; })() : 0; // each file once, as in the APK
  const tot = STORE.used + STORE.free;
  let h = `<div class="pageh"><h1>${esc(t('downloads', st.lang))}</h1><span class="n">${esc(t('count', st.lang, { n: mine.length }))}</span></div>`;
  h += `<div class="panel"><div class="stats"><div class="stat"><small>${esc(t('used', st.lang))}</small><b>${fmtB(STORE.used)}</b></div><div class="stat"><small>${esc(t('freeSpace', st.lang))}</small><b>${fmtB(STORE.free)}</b></div><div class="stat"><small>${esc(t('inside', st.lang))}</small><b>${fmtB(base)}</b></div></div>`
    + (tot ? `<div class="meter" aria-hidden="true"><i style="width:${(100 * STORE.used) / tot}%;background:var(--acc)"></i></div>` : '') + '</div>';
  if (act.length) h += `<div class="panel"><h2>${esc(t('inProgress', st.lang))}</h2><div class="list">${act.map((it) => `<div class="li" data-row="${esc(it.id)}"><button class="open" type="button" data-id="${esc(it.id)}"><span class="lt">${thumbHTML(it)}</span><span class="lx"><b>${esc(L(it.title, st.lang))}</b>${progHTML(it)}</span></button><button class="btn ghost sm" type="button" data-cancel="${esc(it.id)}">${ic('x')}${esc(t('cancel', st.lang))}</button></div>`).join('')}</div>${act.length > 1 ? `<div class="links"><button class="btn ghost sm" type="button" data-cancelall>${esc(t('cancelAll', st.lang))}</button></div>` : ''}</div>`;
  h += `<div class="panel"><h2>${esc(t('onPhone', st.lang))}</h2>` + (mine.length ? `<div class="list">${mine.map((it) => `<div class="li"><button class="open" type="button" data-id="${esc(it.id)}"><span class="lt">${thumbHTML(it)}</span><span class="lx"><b>${esc(L(it.title, st.lang))}</b><span>${esc(subjName(it.subject))} · ${fmtB(it.bytes || 0)}${STORE.state(it.id) === 'stale' ? ' · ' + esc(t('updateNote', st.lang)) : ''}</span></span></button><button class="btn bad sm" type="button" data-del="${esc(it.id)}" aria-label="${esc(t('del', st.lang))}">${ic('trash')}<span>${esc(t('del', st.lang))}</span></button></div>`).join('')}</div><div class="links"><button class="btn bad sm" type="button" data-delall>${ic('trash')}${esc(t('delAll', st.lang))}</button></div>` : `<p class="note">${esc(t('nothing', st.lang))}</p>`) + '</div>';
  h += `<div class="panel"><h2>${esc(t('bySubject', st.lang))}</h2><div class="list">${CAT.subjects.map((s) => {
    const ids = ITEMS.filter((it) => it.subject === s.id && STORE.state(it.id) !== 'inapp').map((it) => it.id);
    const todo = ids.filter((id) => !['ready', 'downloading', 'queued', 'waiting'].includes(STORE.state(id)));
    const need = STORE.need(todo);
    return `<div class="subj" style="--sub:${s.color}"><span class="sn"><i></i>${esc(L(s.name, st.lang))} <small>${esc(t('count', st.lang, { n: ITEMS.filter((it) => it.subject === s.id).length }))}</small></span>${todo.length && need ? `<button class="btn ghost sm" type="button" data-dlsub="${s.id}">${ic('download')}${esc(t('downloadAll', st.lang, { s: fmtB(need) }))}</button>` : `<span class="okline">${ic('check')}${esc(t('allDone', st.lang))}</span>`}</div>`;
  }).join('')}</div><p class="note">${esc(t('bySubjectNote', st.lang))}</p></div>`;
  return h;
}
function unionBytes(ids) { if (!PACKS) return 0; const s = new Set(); for (const id of ids) for (const i of (PACKS.items[id] || { files: [] }).files) s.add(i); let b = 0; for (const i of s) b += PACKS.files[i][2]; return b; }
function licence() { try { return JSON.parse(localStorage.getItem('duet.lic.v1') || 'null'); } catch (e) { return null; } }
function pageMore() {
  const lic = licence(); const today = new Date().toISOString().slice(0, 10);
  const per = {}; for (const it of ITEMS) per[it.app] = (per[it.app] || 0) + 1;
  let ver = CAT.built; try { if (window.DuetNative && DuetNative.version) ver = DuetNative.version() + ' · ' + CAT.built; } catch (e) { /* web */ }
  let h = `<div class="pageh"><h1>${esc(t('more', st.lang))}</h1></div>`;
  h += `<div class="panel"><h2>${esc(t('language', st.lang))}</h2><div class="seg" role="group">${LANGS.map(([k, n]) => `<button type="button" data-lang="${k}" aria-pressed="${st.lang === k}" lang="${k === 'hi' ? 'hi' : 'en'}">${esc(n)}</button>`).join('')}</div><p class="note" style="margin-top:.7rem">${esc(t('langNote', st.lang))}</p></div>`;
  const codeTxt = lic && lic.u >= today ? t('codeOk', st.lang, { n: lic.n || 'DUET STEM', d: lic.u }) : lic && lic.u ? t('codeExpired', st.lang, { d: lic.u }) : t('codeNone', st.lang);
  h += `<div class="panel"><h2>${esc(t('code', st.lang))}</h2><p class="lead">${esc(codeTxt)}</p>${lic && lic.u >= today && lic.a && !lic.a.includes('*') ? `<div class="appl">${lic.a.map((a) => `<span>${esc(CAT.apps[a] ? L(CAT.apps[a].name, st.lang) : a)}</span>`).join('')}</div>` : ''}<div class="links"><button class="btn ghost sm" type="button" data-code>${ic('key')}${esc(t('enterCode', st.lang))}</button></div><p class="note" style="margin-top:.6rem">${esc(t('codeHelp', st.lang))}</p></div>`;
  h += `<div class="panel"><h2>${esc(t('about', st.lang))}</h2><p class="lead">${esc(t('aboutText', st.lang))}</p><dl class="kv"><dt>${esc(t('version', st.lang))}</dt><dd>${esc(ver)}</dd><dt>${esc(t('activities', st.lang))}</dt><dd>${ITEMS.length}</dd><dt>${esc(t('apps', st.lang))}</dt><dd><div class="appl">${Object.entries(CAT.apps).map(([k, a]) => `<span>${esc(L(a.name, st.lang))} · ${per[k] || 0}</span>`).join('')}</div></dd></dl>`
    + `<p class="note" style="margin-top:.8rem">${esc(t('remote', st.lang))}</p><div class="links"><a class="btn ghost sm" href="../science/privacy.html">${esc(t('privacy', st.lang))}</a><a class="btn ghost sm" href="../science/credits.html">${esc(t('credits', st.lang))}</a><a class="btn ghost sm" href="../support.html">${esc(t('support', st.lang))}</a></div></div>`;
  return h;
}

// ------------------------------------------------------------------ the detail page
function progHTML(it) {
  const s = STORE.state(it.id), p = STORE.progress(it.id) || { done: 0, total: 0 };
  const pc = p.total ? Math.min(100, (100 * p.done) / p.total) : 0;
  const txt = s === 'waiting' ? t('waitingNet', st.lang) : s === 'queued' ? t('queued', st.lang) : t('downloading', st.lang, { d: fmtB(p.done), t: fmtB(p.total || it.bytes || 0) });
  return `<div class="prog${s === 'waiting' || (s === 'queued' && !p.done) ? ' wait' : ''}" data-prog="${esc(it.id)}"><div class="pt"><span>${esc(txt)}</span><span>${s === 'downloading' ? Math.floor(pc) + '%' : ''}</span></div><div class="track"><i style="width:${pc}%"></i></div></div>`;
}
function playLabel(it) { const m = it.modes.includes(st.mode) && st.mode !== 'screen' ? L(MODE_BY[st.mode].name, st.lang) : null; return m ? t('playIn', st.lang, { m }) : t('play', st.lang); }
function actHTML(it) {
  const s = STORE.state(it.id);
  const play = `<button class="btn play wide" type="button" data-play="${esc(it.id)}">${ic('play')}${esc(playLabel(it))}</button>`;
  if (s === 'online') return `<div class="act"><div class="row">${play}</div><p class="note">${esc(t('online', st.lang))}${it.bytes ? ' · ' + esc(t('size', st.lang)) + ' ' + fmtB(it.bytes) : ''}</p></div>`;
  if (s === 'inapp') return `<div class="act"><div class="okline">${ic('check')}${esc(t('inApp', st.lang))}</div><div class="row">${play}</div></div>`;
  if (s === 'ready') return `<div class="act"><div class="okline">${ic('check')}${esc(t('ready', st.lang))} · ${fmtB(it.bytes || 0)}</div><div class="row">${play}<button class="btn ghost" type="button" data-del="${esc(it.id)}">${ic('trash')}${esc(t('del', st.lang))}</button></div></div>`;
  if (s === 'stale') return `<div class="act"><p class="note">${esc(t('updateNote', st.lang))}</p><div class="row">${play}<button class="btn pri" type="button" data-dl="${esc(it.id)}">${ic('refresh')}${esc(t('update', st.lang, { s: fmtB(STORE.need([it.id]) || it.bytes) }))}</button></div></div>`;
  if (s === 'downloading' || s === 'queued' || s === 'waiting') return `<div class="act"><div class="row">${progHTML(it)}<button class="btn ghost" type="button" data-cancel="${esc(it.id)}">${ic('x')}${esc(t('cancel', st.lang))}</button></div></div>`;
  const need = STORE.need([it.id]);
  const err = s === 'error' ? `<p class="note err">${esc(STORE.error(it.id) === 'space' ? t('noSpace', st.lang) : t('failed', st.lang))}</p>` : '';
  return `<div class="act">${err}<div class="row"><button class="btn pri wide" type="button" data-dl="${esc(it.id)}">${ic(s === 'error' ? 'refresh' : 'download')}${esc(s === 'error' ? t('retry', st.lang) : t('downloadSize', st.lang, { s: fmtB(need || it.bytes || 0) }))}</button></div></div>`;
}
function waysHTML(it) {
  const app = CAT.apps[it.app] || {};
  const list = MODES.filter((m) => !m.planned || it.modes.includes(m.id));
  return `<div class="ways"><h3>${esc(t('waysToUse', st.lang))}</h3><div class="wgrid">${list.map((m) => { const on = it.modes.includes(m.id); const d = (app.howto && app.howto[m.id]) || m.desc; return `<div class="way${on ? (m.id === st.mode ? ' on' : '') : ' off'}"><span class="wi">${ic(m.icon)}</span><span><b>${esc(L(m.name, st.lang))}</b><p>${esc(on ? L(d, st.lang) : t('notHere', st.lang))}</p></span></div>`; }).join('')}</div></div>`;
}
function detailHTML(it, need) {
  const sameCh = it.chapter ? ITEMS.filter((x) => x !== it && x.chapter && x.chapter.en === it.chapter.en && x.subject === it.subject) : [];
  const rel = (sameCh.length >= 2 ? sameCh : ITEMS.filter((x) => x !== it && x.subject === it.subject && x.classes.some((c) => it.classes.includes(c)))).slice(0, 12);
  const app = CAT.apps[it.app];
  const meta = [`<span><i style="--sub:${subjColor(it.subject)}"></i>${esc(subjName(it.subject))}</span>`, `<span>${esc(clsLabel(it))}</span>`, `<span>${esc(t('t_' + it.type, st.lang))}</span>`];
  if (it.steps) meta.push(`<span>${esc(t('steps', st.lang, { n: it.steps }))}</span>`);
  if (it.place) meta.push(`<span>${esc(t('inReal', st.lang))}</span>`);
  if (it.bytes) meta.push(`<span>${ic('download')}${fmtB(it.bytes)}</span>`);
  meta.push(it.free ? `<span class="free">${esc(t('free', st.lang))}</span>` : `<span>${ic('key')}${esc(t('codeNeeded', st.lang))}</span>`);
  return `<div class="dtop"><button class="back" type="button" data-close>${ic('left')}${esc(t('back', st.lang))}</button><span class="crumb">${esc(subjName(it.subject))} · ${esc(L(app.name, st.lang))}</span></div>
  <div class="dwrap"><div class="hero2" style="--sub:${subjColor(it.subject)}">${thumbHTML(it).replace('class="thumb"', 'class="thumb" style="position:absolute;inset:0;aspect-ratio:auto"')}<span class="badge">${esc(t('t_' + it.type, st.lang))}</span></div>
  <div class="dinfo"><h1>${esc(L(it.title, st.lang))}</h1><div class="meta">${meta.join('')}</div>
  ${it.chapter ? `<div class="chap"><b>${esc(t('chapter', st.lang))}:</b> ${esc(L(it.chapter, st.lang))}</div>` : ''}
  ${need && STORE.native && !['ready', 'inapp'].includes(STORE.state(it.id)) ? `<div class="needbar">${ic('download')}<span>${esc(t('need', st.lang))}</span></div>` : ''}
  <div id="actbox">${actHTML(it)}</div>
  <p class="desc">${esc(L(it.desc, st.lang))}</p>
  ${waysHTML(it)}</div></div>
  ${rel.length ? `<section class="dsec"><h3>${esc(sameCh.length >= 2 ? t('related', st.lang) : t('relatedSubject', st.lang, { s: subjName(it.subject) }))}</h3><div class="strip">${rel.map(card).join('')}</div></section>` : ''}`;
}

// ------------------------------------------------------------------ playing an activity
function playUrl(it) {
  const mode = it.modes.includes(st.mode) ? st.mode : 'screen';
  let u = (it.urls && (it.urls[mode] || it.urls.screen || it.urls.box)) || it.url;
  const lang = CAT.apps[it.app] && CAT.apps[it.app].lang;
  if (lang === 'url') { const [a, h] = u.split('#'); u = a + (a.includes('?') ? '&' : '?') + 'lang=' + st.lang + (h ? '#' + h : ''); }
  else if (lang && lang.startsWith('store:')) try { localStorage.setItem(lang.slice(6), st.lang); } catch (e) { /* private */ }
  return '../' + u;
}
function play(it) {
  const s = STORE.state(it.id);
  if (STORE.native && !['ready', 'inapp', 'stale'].includes(s)) { STORE.download(it.id); render(); return; }
  keep.set('lastPlayed', it.id);
  location.href = playUrl(it);
}

// ------------------------------------------------------------------ chrome: tabs, mode tabs, language
const TABS = [['home', 'home', '#home'], ['experiments', 'flask', '#exp'], ['models', 'cube', '#models'], ['downloads', 'download', '#downloads'], ['more', 'more', '#more']];
function renderChrome() {
  document.documentElement.lang = st.lang === 'hi' ? 'hi' : 'en';
  $('#tabs').innerHTML = `<div class="rail-logo"><img src="icons/icon-192.png" alt=""></div>` + TABS.map(([k, i, h]) => `<button type="button" data-href="${h}" aria-current="${st.tab === k ? 'page' : 'false'}">${ic(i, k === 'downloads' && STORE.activeIds().length ? '' : '')}<span class="${k === 'downloads' && STORE.activeIds().length ? 'dot' : ''}">${esc(k === 'models' ? t('modelsShort', st.lang) : t(k, st.lang))}</span></button>`).join('');
  $('#modes').innerHTML = TABMODES.map((m) => `<button type="button" role="tab" data-mode="${m.id}" aria-selected="${st.mode === m.id}" title="${esc(L(m.desc, st.lang))}">${ic(m.icon)}<span>${esc(L(m.name, st.lang))}</span></button>`).join('');
  $('#langbtn').textContent = st.lang === 'en' ? 'EN' : st.lang === 'hi' ? 'हिं' : 'HG';
  $('#q').placeholder = t('search', st.lang); $('#q').setAttribute('aria-label', t('searchShort', st.lang));
}
function route() {
  const h = decodeURIComponent(location.hash.slice(1) || 'home'); const [k, ...rest] = h.split('/'); const arg = rest.join('/');
  return { k, arg };
}
let lastView = '';
function render(opts = {}) {
  const r = route();
  const detail = r.k === 'item' || r.k === 'need';
  if (!detail) { st.tab = { home: 'home', exp: 'experiments', models: 'models', downloads: 'downloads', more: 'more' }[r.k] || (r.k === 'all' || r.k === 'search' ? st.tab : 'home'); st.last = location.hash || '#home'; }
  renderChrome();
  const v = $('#view');
  const key = detail ? lastView : location.hash + '|' + st.lang + '|' + st.mode + '|' + st.cls + '|' + st.subj;
  if (!detail || !v.innerHTML) {
    const html = r.k === 'exp' ? pageExp() : r.k === 'models' ? pageModels() : r.k === 'downloads' ? pageDownloads() : r.k === 'more' ? pageMore() : r.k === 'all' && SUBJ_BY[r.arg] ? pageAll(r.arg) : r.k === 'search' ? pageSearch(r.arg) : pageHome();
    const keepScroll = key === lastView || opts.keep; const y = v.scrollTop;
    v.innerHTML = html; if (keepScroll) v.scrollTop = y; else v.scrollTop = 0;
    lastView = key;
  }
  const d = $('#detail');
  if (detail && BY[r.arg]) {
    const it = BY[r.arg]; const was = !d.hidden && d.dataset.id === it.id; const y = d.scrollTop;
    d.innerHTML = detailHTML(it, r.k === 'need'); d.dataset.id = it.id; d.hidden = false;
    if (was) d.scrollTop = y; else { d.scrollTop = 0; requestAnimationFrame(() => { const b = d.querySelector('[data-play],[data-dl],[data-cancel]'); if (b && opts.focus !== false && (matchMedia('(pointer: coarse)').matches === false || kbd)) b.focus({ preventScroll: true }); }); }
  } else if (!d.hidden) { d.hidden = true; d.innerHTML = ''; restoreFocus(); }
}
let kbd = false, lastFocus = null;
addEventListener('keydown', () => { kbd = true; }, true); addEventListener('pointerdown', () => { kbd = false; }, true);
function restoreFocus() { if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: false }); else if (kbd) { const c = $('#view .card'); if (c) c.focus(); } }
// only the progress parts change while a download runs (no full redraw: the page does not jump)
function updateProgress(id) {
  for (const el of document.querySelectorAll(`[data-prog="${CSS.escape(id)}"]`)) { const it = BY[id]; if (it) el.outerHTML = progHTML(it); }
  for (const c of document.querySelectorAll(`.card[data-id="${CSS.escape(id)}"]`)) { const p = STORE.progress(id); const b = c.querySelector('.bar i'); if (b && p) b.style.width = (p.total ? (100 * p.done) / p.total : 0) + '%'; const s = c.querySelector('.st.dl'); if (s && p && p.total) s.lastChild.textContent = Math.floor((100 * p.done) / p.total) + '%'; if (!b || !s) c.outerHTML = card(BY[id]); }
}
let tT = 0; function toast(msg) { const e = $('#toast'); e.textContent = msg; e.classList.add('on'); clearTimeout(tT); tT = setTimeout(() => e.classList.remove('on'), 3200); }
function ask(q, yes) {
  const a = $('#ask'); $('#askq').textContent = q; $('#askyes').textContent = t('yes', st.lang); $('#askno').textContent = t('no', st.lang); const prev = document.activeElement; a.hidden = false; $('#askno').focus();
  const done = (ok) => { a.hidden = true; $('#askyes').onclick = $('#askno').onclick = null; if (prev && document.contains(prev)) prev.focus(); if (ok) yes(); };
  $('#askyes').onclick = () => done(true); $('#askno').onclick = () => done(false); a.onclick = (e) => { if (e.target === a) done(false); };
}
function go(h) { if (location.hash === h) render(); else location.hash = h; }
function back() {
  if (!$('#ask').hidden) { $('#askno').click(); return true; }
  const r = route();
  if (r.k === 'item' || r.k === 'need') { if (history.length > 1 && openedHere) history.back(); else go(st.last && !/^#(item|need)/.test(st.last) ? st.last : '#home'); return true; }
  if (r.k !== 'home' && location.hash) { if (r.k === 'all' || r.k === 'search') { history.back(); return true; } go('#home'); return true; }
  return false;
}
let openedHere = false;

// ------------------------------------------------------------------ events
function onClick(e) {
  const b = e.target.closest('button, a'); if (!b) return;
  const d = b.dataset;
  if (d.id) { lastFocus = b; openedHere = true; go('#item/' + encodeURIComponent(d.id)); return; }
  if (d.href) { go(d.href); return; }
  if (d.mode) { st.mode = d.mode; keep.set('mode', st.mode); render({ keep: true }); return; }
  if (d.cls != null) { st.cls = d.cls; keep.set('cls', st.cls); render({ keep: true }); restoreChip('cls', d.cls); return; }
  if (d.subj != null) { st.subj = d.subj; keep.set('subj', st.subj); render({ keep: true }); restoreChip('subj', d.subj); return; }
  if (d.lang) { setLang(d.lang); return; }
  if (d.play) { play(BY[d.play]); return; }
  if (d.dl) { STORE.download(d.dl); refreshAct(d.dl); return; }
  if (d.cancel) { STORE.cancel(d.cancel); return; }
  if (d.cancelall) { for (const id of STORE.activeIds()) STORE.cancel(id); return; }
  if (d.del) { const it = BY[d.del]; ask(t('delQ', st.lang, { t: L(it.title, st.lang) }), () => { const f = STORE.remove(it.id); toast(t('removed', st.lang, { s: fmtB(f) })); render({ keep: true }); }); return; }
  if (d.delall != null) { ask(t('delAllQ', st.lang), () => { const f = STORE.removeAll(); toast(t('removed', st.lang, { s: fmtB(f) })); render({ keep: true }); }); return; }
  if (d.dlsub) { for (const it of ITEMS.filter((x) => x.subject === d.dlsub)) if (STORE.state(it.id) === 'none' || STORE.state(it.id) === 'error' || STORE.state(it.id) === 'stale') STORE.download(it.id); render({ keep: true }); return; }
  if (d.close != null || d.back != null) { back(); return; }
  if (d.code != null) { enterCode(); return; }
}
function restoreChip(k, v) { if (!kbd) return; const c = document.querySelector(`.chip[data-${k}="${CSS.escape(v)}"]`); if (c) c.focus({ preventScroll: true }); }
function refreshAct(id) { const box = $('#actbox'); const r = route(); if (box && r.arg === id) box.innerHTML = actHTML(BY[id]); for (const c of document.querySelectorAll(`.card[data-id="${CSS.escape(id)}"]`)) c.outerHTML = card(BY[id]); }
function setLang(l) { st.lang = l; keep.set('lang', l); for (const it of ITEMS) delete it._hay; render({ keep: true }); }
function enterCode() {
  const run = () => { try { window.DuetGate.init({ app: 'hub', title: 'DUET STEM 360', lang: () => st.lang, onChange: () => render({ keep: true }) }); if (window.DuetGate.state === 'ok') toast(t('codeOk', st.lang, { n: '', d: '' }).replace(/ · +·/, '')); else window.DuetGate.open('start'); } catch (e) { /* no code screen */ } };
  if (window.DuetGate) { run(); return; }
  const s = document.createElement('script'); s.src = '../body/duetgate.js'; s.onload = run; document.head.appendChild(s);
}
function onStoreEvent(e) {
  if (!e || !e.id) { render({ keep: true }); return; }
  if (e.type === 'progress' || e.type === 'waiting' || e.type === 'queued') { updateProgress(e.id); const r = route(); if (r.arg === e.id && $('#actbox') && !$('#actbox [data-prog]')) refreshAct(e.id); renderChrome(); return; }
  if (e.type === 'done') toast(t('done', st.lang, { t: L(BY[e.id] && BY[e.id].title, st.lang) }));
  if (e.type === 'error' && e.msg === 'space') toast(t('noSpace', st.lang));
  const f = document.activeElement && document.activeElement.dataset ? { ...document.activeElement.dataset } : null;
  render({ keep: true, focus: false });
  if (f && kbd) { const k = Object.keys(f)[0]; const el = k && document.querySelector(`[data-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}="${CSS.escape(f[k])}"]`); (el || document.querySelector('#actbox button'))?.focus({ preventScroll: true }); }
}

// ------------------------------------------------------------------ start
async function start() {
  const get = (u) => fetch(u, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  [CAT, PACKS] = await Promise.all([get('catalog.json'), get('packs.json')]);
  if (!CAT) { $('#view').innerHTML = '<div class="empty">catalog.json could not be read.</div>'; return; }
  ITEMS = CAT.items; BY = Object.fromEntries(ITEMS.map((it) => [it.id, it]));
  MODES = CAT.modes; MODE_BY = Object.fromEntries(MODES.map((m) => [m.id, m])); SUBJ_BY = Object.fromEntries(CAT.subjects.map((s) => [s.id, s]));
  TABMODES = MODES.filter((m) => m.tab && ITEMS.some((it) => it.modes.includes(m.id)));
  if (!MODE_BY[st.mode] || !TABMODES.includes(MODE_BY[st.mode])) st.mode = 'screen';
  if (PACKS) for (const it of ITEMS) { const p = PACKS.items[it.id]; if (p) it.bytes = p.bytes; }
  STORE = makeStore(PACKS, onStoreEvent);
  document.addEventListener('click', onClick);
  $('#sform').addEventListener('submit', (e) => { e.preventDefault(); $('#q').blur(); });
  let qT = 0; $('#q').addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { const q = $('#q').value.trim(); const h = q ? '#search/' + encodeURIComponent(q) : (st.last && !/^#search/.test(st.last) ? st.last : '#home'); if (route().k === 'search' && q) history.replaceState(null, '', h); else if (q) location.hash = h; else history.replaceState(null, '', h); render(); }, 180); });
  $('#langbtn').addEventListener('click', () => setLang(st.lang === 'en' ? 'hi' : st.lang === 'hi' ? 'hg' : 'en'));
  addEventListener('hashchange', () => render());
  addEventListener('offline', () => toast(t('offlineNow', st.lang)));
  addEventListener('pageshow', (e) => { if (e.persisted) { STORE.refresh(); render({ keep: true }); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && STORE.native) { STORE.refresh(); render({ keep: true, focus: false }); } });
  initNav(back);
  if (route().k === 'search') $('#q').value = route().arg;
  render();
  window.__hub = { st, CAT, PACKS, STORE, render, playUrl }; // for tests
  document.documentElement.classList.add('ready');
}
start();
