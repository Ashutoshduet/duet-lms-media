// DUET Robotics Lab 360, batch 3: the app's side of the school-lab modules and of the block editor. main.js calls
// install3(app) once; everything else is done here, on the app (a few of its methods are wrapped, each marked "batch 3"):
//   the texts (compiler messages, specs, UI words) in English, Hindi and Hinglish; each new module's live line and its
//   controls in the part callout (LCD contrast and address, the remote's buttons, the keypad's keys, the cards, …);
//   pressing the 3D keypad's keys and the 3D remote's buttons; the scenes next to the bench (worlds3.js); the block
//   editor (blocks.js) beside the C++; test hooks (window.robo3).
import { T, t, tx, CPP, SPEC } from './i18n.js';
import { LESSONS } from './lessons.js';
import { PARTS } from './parts.js';
import { MSG3, lcdText, oledLit, REMOTE, CARDS, uidText } from './libs3.js';
import { SPEC3, KEYMAP, irSend, rfidShow, keyPress, keyRelease } from './parts3.js';
import { makeWorld3, isWorld3 } from './worlds3.js';
import { BlockEditor, toBlocks, toCpp, blockDiff, blockCat } from './blocks.js';

const t3 = (en, hi, hg) => ({ en, hi, hg });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtI = (i) => { const a = Math.abs(i || 0); return a >= 1 ? a.toFixed(2) + ' A' : (a * 1000).toFixed(a < 0.01 ? 1 : 0) + ' mA'; };
export const T3 = {
  contrast: t3('Contrast (blue knob)', 'कंट्रास्ट (नीला नॉब)', 'Contrast (neela knob)'), addr: t3('I2C address', 'I2C पता', 'I2C address'), hum3: t3('Humidity %', 'नमी %', 'Nami %'),
  moist: t3('Soil moisture %', 'मिट्टी की नमी %', 'Mitti ki nami %'), wave: t3('Wave a hand in front', 'सामने हाथ हिलाइए', 'Saamne haath hilaiye'), hold3: t3('Stays on (Tx knob)', 'चालू रहता है (Tx नॉब)', 'On rehta hai (Tx knob)'),
  remote3: t3('Remote', 'रिमोट', 'Remote'), keys3: t3('Press a key', 'कोई बटन दबाइए', 'Koi button dabaiye'), card3: t3('White card', 'सफ़ेद कार्ड', 'Safed card'), tag3: t3('Blue tag', 'नीला टैग', 'Neela tag'),
  gas3: t3('LPG in the air (ppm)', 'हवा में एलपीजी (ppm)', 'Hawa mein LPG (ppm)'), thr3: t3('DO limit (blue knob)', 'DO सीमा (नीला नॉब)', 'DO limit (neela knob)'), scene3: t3('Use the panel of the scene next to the bench.', 'बेंच के पास वाले दृश्य का पैनल इस्तेमाल कीजिए।', 'Bench ke paas wale scene ka panel use kijiye.'),
  noPow3: t3('no power', 'बिजली नहीं', 'power nahi'), notInit: t3('not set up yet (lcd.init)', 'अभी सेट नहीं हुआ (lcd.init)', 'abhi set nahi hua (lcd.init)'), learn3: t3('learning the room…', 'कमरा समझ रहा है…', 'room samajh raha hai…'),
  over5: t3('⚠ 5 V on a 3.3 V chip!', '⚠ 3.3 V की चिप पर 5 V!', '⚠ 3.3 V ki chip par 5 V!'), onReader: t3('on the reader', 'रीडर पर', 'reader par'), warm3: t3('warming up', 'गर्म हो रहा है', 'garam ho raha hai'),
  bkBlocks: t3('Blocks', 'ब्लॉक', 'Blocks'), bkCpp: t3('C++', 'C++', 'C++'),
};

// ------------------------------------------------------------------ a module's live line (the hover tip, the callout, the headset's panel)
function live3(app, p) {
  const s = p.state, lab = app.lab;
  const v = (k) => lab.voltageAt(p.ep[k]);
  switch (p.type) {
    case 'lcd16': { if (!s.powered) return tx(T3.noPow3); if (!s.initd) return tx(T3.notInit); const L = lcdText(p); return `"${L[0].trimEnd()}" · "${L[1].trimEnd()}"${s.bl ? '' : ' · 🌑'}`; }
    case 'oled': { if (!s.powered) return tx(T3.noPow3); const n = oledLit(p); return n ? `${n} dots lit${s.text ? ' · "' + s.text.replace(/\s+/g, ' ').trim().slice(0, 24) + '"' : ''}` : (s.on ? 'on · blank' : '—'); }
    case 'seg7': { if (s.burnt) return t('burnt'); const on = Object.entries(s.seg || {}).filter(([, i]) => i > 0.002).map(([k]) => k.toLowerCase()); return on.length ? on.join(' ') : '—'; }
    case 'dht11': return s.powered ? `${(s.tS || 0).toFixed(1)} °C · ${Math.round(s.hS || 0)} %` : tx(T3.noPow3);
    case 'soil': return s.powered ? `${Math.round((s.moist || 0) * 100)} % · AO ${(s.ao || 0).toFixed(2)} V (${Math.round((s.ao || 0) / 5 * 1023)})${s.wet ? ' · DO LOW' : ''}` : tx(T3.noPow3);
    case 'pir': return !s.powered ? tx(T3.noPow3) : s.age < 2.5 ? tx(T3.learn3) : `OUT ${s.out ? 'HIGH' : 'LOW'}${s.motion ? ' · 🚶' : ''}`;
    case 'relay': return `${s.on ? 'ON · COM–NO' : 'OFF · COM–NC'} · ${s.powered ? fmtI(lab.currentOf(p)) : tx(T3.noPow3)}`;
    case 'irrx': { if (!s.powered) return tx(T3.noPow3); const q = (s.q || []).length; return `${s.got || 0} codes${q ? ' · ' + q + ' waiting' : ''}`; }
    case 'keypad': { const k = Object.keys(s.keys || {}).map((i) => KEYMAP[Math.floor(i / 4)][i % 4]); return k.length ? '● ' + k.join(' ') : '—'; }
    case 'stepper': return `${(s.angle || 0).toFixed(1)}° · ${Math.abs(s.rpm || 0).toFixed(1)} rpm · ${(s.led || []).map((x, i) => (x > 0.3 ? 'ABCD'[i] : '·')).join('')}${s.powered ? '' : ' · ' + tx(T3.noPow3)}`;
    case 'rfid': return s.over ? tx(T3.over5) : !s.powered ? tx(T3.noPow3) : `3.3 V ✓${s.card ? ' · ' + tx(CARDS[s.card.id].name) + ' ' + tx(T3.onReader) : ''}`;
    case 'mq2': return s.powered ? `${Math.round(s.ppm)} ppm · AO ${(s.ao || 0).toFixed(2)} V${s.warm < 0.9 ? ' · ' + tx(T3.warm3) : ''}${s.gas ? ' · DO LOW' : ''}` : tx(T3.noPow3);
    case 'aa4': { const a = v('P'), b = v('N'); return `${a === null || b === null ? '—' : (a - b).toFixed(2)} V · ${fmtI(lab.currentOf(p))}`; }
    case 'pump': return `${(s.flow || 0).toFixed(1)} mL/s · ${fmtI(s.i)}`;
    case 'load230': return `${s.on ? '💡 ON' : 'OFF'} · ${fmtI(s.i)} @ 230 V`;
  }
  return '';
}
// ------------------------------------------------------------------ its controls in the callout
function controls3(app, p) {
  const r = (id, label, min, max, val, step = 1) => `<div class="row"><label>${esc(label)}</label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><span id="${id}-v"></span></div>`;
  const sel = (id, label, opts, val) => `<div class="row"><label>${esc(label)}</label><select id="${id}">${opts.map(([v, l]) => `<option value="${v}"${v === val ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
  const btns = (rows, attr) => rows.map((row) => `<div class="row b3-keys">${row.map(([v, l]) => `<button class="btn" data-${attr}="${esc(v)}">${esc(l)}</button>`).join('')}</div>`).join('');
  const scene = !!(app.world && isWorld3(app.world.cfg)); const hint = `<p class="b3-hint">${esc(tx(T3.scene3))}</p>`;
  switch (p.type) {
    case 'lcd16': return r('co3-con', tx(T3.contrast), 0, 100, Math.round((p.state.contrast ?? 0.55) * 100)) + sel('co3-addr', tx(T3.addr), [['39', '0x27'], ['63', '0x3F']], String(p.props.addr));
    case 'oled': return sel('co3-addr', tx(T3.addr), [['60', '0x3C'], ['61', '0x3D']], String(p.props.addr));
    case 'dht11': return scene ? hint : r('co-temp', t('temp') + ' °C', 0, 50, app.lab.env.temp) + r('co3-hum', tx(T3.hum3), 10, 95, Math.round(app.lab.env.hum ?? 55));
    case 'soil': return scene ? hint : r('co3-moist', tx(T3.moist), 0, 100, Math.round((p.state.moist || 0) * 100));
    case 'pir': return (scene ? '' : `<div class="row"><button class="btn" id="co3-wave">✋ ${esc(tx(T3.wave))}</button></div>`) + sel('co3-hold', tx(T3.hold3), [['3', '3 s'], ['5', '5 s'], ['10', '10 s'], ['30', '30 s']], String(p.props.hold));
    case 'irrx': return `<h4>${esc(tx(T3.remote3))}</h4>` + btns([[['1', '1'], ['2', '2'], ['3', '3']], [['4', '4'], ['5', '5'], ['6', '6']], [['7', '7'], ['8', '8'], ['9', '9']], [['*', '*'], ['0', '0'], ['#', '#']], [['LEFT', '◀'], ['UP', '▲'], ['OK', 'OK'], ['DOWN', '▼'], ['RIGHT', '▶']]], 'rc3');
    case 'keypad': return `<h4>${esc(tx(T3.keys3))}</h4>` + btns(KEYMAP.map((row, ri) => row.map((k, ci) => [String(ri * 4 + ci), k])), 'kp3');
    case 'rfid': return `<div class="row"><button class="btn" data-cd3="card">💳 ${esc(tx(T3.card3))}</button><button class="btn" data-cd3="tag">🔵 ${esc(tx(T3.tag3))}</button></div>`;
    case 'mq2': return (scene ? hint : r('co3-ppm', tx(T3.gas3), 0, 3000, Math.round(p.state.ppm || 5), 10)) + r('co3-thr', tx(T3.thr3), 10, 90, Math.round(p.props.thr * 100));
  }
  return '';
}
function bind3(app, p, el) {
  const q = (s) => el.querySelector(s); const lab = app.lab; const bump = () => { lab.stateV++; lab.instKey = null; app.stage.kick(); };
  if (q('#co3-con')) q('#co3-con').oninput = (e) => { p.state.contrast = e.target.value / 100; p.state.ver = (p.state.ver || 0) + 1; app.stage.kick(); };
  if (q('#co3-addr')) q('#co3-addr').onchange = (e) => { lab.setProps(p, { addr: +e.target.value }); app.renderCallout(); };
  if (q('#co3-hum')) q('#co3-hum').oninput = (e) => { lab.env.hum = +e.target.value; bump(); };
  if (q('#co3-moist')) q('#co3-moist').oninput = (e) => { p.state.moist = e.target.value / 100; bump(); };
  if (q('#co3-wave')) q('#co3-wave').onclick = () => { p.state.motion = true; setTimeout(() => { p.state.motion = false; }, 1500); };
  if (q('#co3-hold')) q('#co3-hold').onchange = (e) => { lab.setProps(p, { hold: +e.target.value }); };
  if (q('#co3-ppm')) q('#co3-ppm').oninput = (e) => { p.state.ppm = +e.target.value; bump(); };
  if (q('#co3-thr')) q('#co3-thr').oninput = (e) => { p.props.thr = e.target.value / 100; bump(); };
  for (const b of el.querySelectorAll('[data-rc3]')) b.onclick = () => { app.sound.unlock(); app.sound.click(); irSend(lab, b.dataset.rc3); };
  for (const b of el.querySelectorAll('[data-kp3]')) { const i = +b.dataset.kp3; b.onpointerdown = (e) => { e.preventDefault(); app.sound.click(); keyPress(lab, p, i, 99); if (app.world && app.world.sim && app.world.sim.typedKey) app.world.sim.typedKey(KEYMAP[Math.floor(i / 4)][i % 4]); }; const up = () => keyRelease(lab, p, i); b.onpointerup = up; b.onpointerleave = up; b.onpointercancel = up; }
  for (const b of el.querySelectorAll('[data-cd3]')) b.onclick = () => rfidShow(lab, b.dataset.cd3);
  for (const [id, f] of [['co3-con', (v) => v + '%'], ['co3-hum', (v) => v + ' %'], ['co3-moist', (v) => v + ' %'], ['co3-ppm', (v) => v + ' ppm'], ['co3-thr', (v) => v + '%']]) { const i = q('#' + id), o = q('#' + id + '-v'); if (i && o) { const f2 = () => { o.textContent = f(i.value); }; i.addEventListener('input', f2); f2(); } }
}

const CSS3 = `
#callout .b3-keys{gap:5px;flex-wrap:nowrap}#callout .b3-keys .btn{flex:1;min-width:0;padding:8px 0;font-size:15px}
#callout .b3-hint{font-size:12.5px;color:var(--mute);margin:4px 0}
`;

export function install3(app) {
  Object.assign(CPP, MSG3); Object.assign(SPEC, SPEC3); Object.assign(T, T3); void REMOTE; void uidText;
  if (!document.getElementById('b3-css0')) { const st = document.createElement('style'); st.id = 'b3-css0'; st.textContent = CSS3; document.head.appendChild(st); }
  for (const l of LESSONS) if (l.scene && l.world && !l.world.make) l.world.make = makeWorld3; // the scene beside the bench (main.js: setWorld)
  const W = (name, f) => { const o = app[name].bind(app); app[name] = (...a) => f(o, ...a); };
  // the modules' live lines and callout controls
  W('partLive', (o, p) => o(p) || live3(app, p)); // batch 3
  W('controlsFor', (o, p) => o(p) || controls3(app, p)); // batch 3
  W('bindControls', (o, el) => { o(el); const p = app.sel && app.sel.part; if (p) bind3(app, p, el); }); // batch 3
  // a key of the 3D keypad, a button of the 3D remote, the RFID card on the desk: pressed by a mouse, a finger or a headset's
  // ray (xrui.js calls this too). Returns what lets it go again, or null when the hit is none of these
  app.press3 = (hit) => {
    if (hit && hit.kind === 'part' && hit.role && hit.role.startsWith('key3:')) {
      const part = app.lab.parts.find((p) => p.uid === hit.uid); const i = +hit.role.slice(5); app.sound.unlock(); app.sound.click(); keyPress(app.lab, part, i, 99);
      if (app.world && app.world.sim && app.world.sim.typedKey) app.world.sim.typedKey(KEYMAP[Math.floor(i / 4)][i % 4]);
      return () => { if (part.state.keys && part.state.keys[i] >= 99) keyPress(app.lab, part, i, 0.12); else keyRelease(app.lab, part, i); }; // (let go: down 0.12 s more, as a real finger, so a quick tap or pinch is not shorter than the sketch's scan)
    }
    if (hit && hit.kind === 'world' && app.world && app.world.tap && isWorld3(app.world.cfg)) { app.sound.unlock(); if (app.world.tap(hit.role)) { app.renderWorld(false); return () => {}; } }
    return null;
  };
  // the keypad's keys and the remote's buttons, pressed in 3D (a mouse, a finger)
  W('down', (o, e) => { // batch 3
    if (!(window.DuetGate && DuetGate.active) && !(e.pointerType === 'mouse' && e.button !== 0) && app.tool !== 'probe' && !(e.pointerType === 'touch' && app.touches && app.touches.size >= 1)) {
      const rel = app.press3(app.view.pickObject(app.ndc(e.clientX, e.clientY)));
      if (rel) { app.drag = { kind: 'press3', release: rel }; app.block(e); return; }
    }
    return o(e);
  });
  W('up', (o, e, cancel) => { const d = app.drag; if (d && d.kind === 'press3') { app.drag = null; app.stage.controls.enabled = true; d.release(); return; } return o(e, cancel); }); // batch 3
  // the block editor beside the C++
  const bk = new BlockEditor(app); app.blocks3 = bk;
  W('openLesson', (o, id, quiet) => { const r = o(id, quiet); bk.onLesson(app.rt.lesson); return r; }); // batch 3
  W('openFree', (o) => { const r = o(); bk.onFree(); return r; }); // batch 3
  W('onEdit', (o, v) => { o(v); bk.onCode(v); }); // batch 3
  W('setLang', (o, l) => { o(l); bk.render(); }); // batch 3
  W('renderCard', (o, ...a) => { const r = o(...a); bk.fit(); return r; }); // batch 3: blocks wide while coding
  const ed = app.editor; const sr = ed.setRun.bind(ed); ed.setRun = (line) => { sr(line); bk.showRun(line); };
  { const pd = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ed), 'value'); // C++ put in by the app (a lesson, a board swap, the headset's panel): the blocks follow
    if (pd && pd.set) Object.defineProperty(ed, 'value', { configurable: true, get() { return pd.get.call(ed); }, set(v) { pd.set.call(ed, v); bk.onCode(v); } }); }
  const se = ed.setError.bind(ed); ed.setError = (e) => { se(e); bk.showError(e && e.line); };
  // test hooks (devtools/test/robotest3.mjs)
  window.robo3 = {
    bk, toBlocks, toCpp, lcd: (tag) => { const p = app.lab.byTag(tag); return p ? lcdText(p) : null; }, oled: (tag) => { const p = app.lab.byTag(tag); return p ? { lit: oledLit(p), text: p.state.text || '' } : null; },
    world: () => { const w = app.world; return w && w.sim ? { kind: w.kind, ready: w.ready, flags: [...w.sim.flags], res: w.sim.res, buildMs: w.buildMs } : null; },
    part: (tag) => { const p = app.lab.byTag(tag); return p ? { type: p.type, state: JSON.parse(JSON.stringify(p.state, (k, v) => (v instanceof Uint8Array ? undefined : v))) } : null; },
    calls: () => new Promise((res) => { // the draw calls of one whole frame (all the passes), not only its last pass
      const r = app.stage.renderer; app.stage.kick && app.stage.kick();
      requestAnimationFrame(() => { r.info.autoReset = false; r.info.reset(); const f0 = app.stage.frames || 0; let k = 0; const tick = () => { app.stage.kick(); if (++k < 6) { requestAnimationFrame(tick); return; } const n = Math.max(1, (app.stage.frames || 0) - f0); const c = { calls: Math.round(r.info.render.calls / n), tris: Math.round(r.info.render.triangles / n), frames: n }; r.info.autoReset = true; res(c); }; requestAnimationFrame(tick); });
    }),
    // where a key of the keypad, a remote button or a card is on the screen
    roleAt: (tag, role) => { const p = app.lab.byTag(tag); const e = p && app.view.parts.get(p.uid); let o = null; if (e) e.obj.traverse((q) => { if (q.userData.role === role) o = q; }); if (!o) return null; return screenOf(app, o); },
    worldRole: (role) => { const w = app.world; const o = w && w.picks.find((q) => q.userData.role === role); return o ? screenOf(app, o) : null; },
    // the block editor: what to change in the blocks to get this C++ (values to type, blocks to drag in), a block's palette group
    blkDiff: (want) => { const r = toBlocks(want); if (!r.ok || !bk.prog) return null; const d = blockDiff(bk.prog, r.prog); return d && d.map((c) => ({ kind: c.kind, id: c.block.id, key: c.key, v: c.kind === 'slot' ? JSON.parse(JSON.stringify(c.v)) : c.v })); },
    blkCat: (t) => blockCat(t), blkSlot: (id, k) => { let f = null; const w = (x) => { if (!x || f) return; if (x.id === id) { f = x.i[k] && x.i[k].id; return; } Object.values(x.i || {}).forEach(w); (x.s || []).forEach(w); (x.e || []).forEach(w); }; for (const s of bk.prog.stacks) s.body.forEach(w); return f; },
  };
}
function screenOf(app, o) {
  const THREE_ = o.position.constructor; const v = new THREE_(); o.updateMatrixWorld(true); o.getWorldPosition(v);
  const r = app.stage.renderer.domElement.getBoundingClientRect(); v.project(app.stage.camera); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
}
void PARTS;
