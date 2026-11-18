// DUET Robotics Lab 360, batch 4: the phone on the bench and the school's WiFi router (the ESP32 lessons). Nothing here
// uses a real network: the phone talks to the ESP32 through esp32.js (netOf(lab)).
//   The phone: a 3D phone on a stand; its screen is a canvas. Apps: Browser (a small browser: it shows the HTML the
//   sketch sends — headings, text, links, buttons, colours, an SVG chart — follows links and <meta refresh>), BT Terminal
//   (like the Serial Bluetooth Terminal app: connect, send 1 / 0 / your own text, see what the ESP32 answers) and WiFi
//   (the networks it can see: the school's, or the ESP32's own soft AP). A keyboard on the screen types addresses.
//   A tap (mouse, finger, or a headset's ray) reaches the screen as region 'phone@u,v' (view.js), and phone.tap(u, v).
//   The router: a white box with two aerials and blinking lights; its sticker shows the WiFi name and password.
import * as THREE from 'three';
import { netOf, SCHOOL, parseUrl } from './esp32.js';
import { materials, box, cyl } from './models.js';
import * as TX from './tex.js';

const FONT = TX.FONT; const SW = 540, SH = 1152; // the screen in its own pixels (drawn smaller on phones)
const t3 = (en, hi, hg) => ({ en, hi, hg });
export const PW = { // the phone's words
  browser: t3('Browser', 'ब्राउज़र', 'Browser'), bt: t3('BT Terminal', 'BT टर्मिनल', 'BT Terminal'), wifi: t3('WiFi', 'WiFi', 'WiFi'),
  addr: t3('Type a web address', 'वेब पता लिखिए', 'Web address likhiye'), go: t3('Go', 'जाइए', 'Go'), loading: t3('Loading…', 'खुल रहा है…', 'Khul raha hai…'),
  noReach: t3('This site can\'t be reached', 'यह साइट नहीं खुल रही', 'Yeh site nahi khul rahi'),
  timeout: t3('{h} took too long to respond. Is the ESP32 on this WiFi, and does loop() call server.handleClient()?', '{h} ने जवाब देने में बहुत देर लगाई। क्या ESP32 इसी WiFi पर है, और क्या loop() में server.handleClient() है?', '{h} ne jawab dene mein bahut der lagaayi. Kya ESP32 isi WiFi par hai, aur kya loop() mein server.handleClient() hai?'),
  name: t3('{h} is not an address the phone can find. Type the ESP32\'s IP address, like 192.168.1.47.', '{h} ऐसा पता नहीं जो फ़ोन ढूँढ सके। ESP32 का IP एड्रेस लिखिए, जैसे 192.168.1.47।', '{h} aisa address nahi jo phone dhoondh sake. ESP32 ka IP address likhiye, jaise 192.168.1.47.'),
  refused: t3('{h} refused to connect: the sketch has not called server.begin().', '{h} ने जुड़ने से मना किया: स्केच ने server.begin() नहीं बुलाया।', '{h} ne judne se mana kiya: sketch ne server.begin() nahi bulaya.'),
  empty: t3('The ESP32 answered with an empty page: did the handler call server.send()?', 'ESP32 ने ख़ाली पेज भेजा: क्या हैंडलर ने server.send() बुलाया?', 'ESP32 ne khaali page bheja: kya handler ne server.send() bulaya?'),
  devices: t3('Devices', 'डिवाइस', 'Devices'), tapConnect: t3('Tap to connect', 'जुड़ने के लिए छूइए', 'Judne ke liye touch karo'),
  noDev: t3('No Bluetooth device. Is the ESP32 running SerialBT.begin("…")?', 'कोई Bluetooth डिवाइस नहीं। क्या ESP32 पर SerialBT.begin("…") चल रहा है?', 'Koi Bluetooth device nahi. Kya ESP32 par SerialBT.begin("…") chal raha hai?'),
  connected: t3('Connected: {n}', 'जुड़ा: {n}', 'Connected: {n}'), notConn: t3('Not connected', 'जुड़ा नहीं', 'Not connected'), lost: t3('Connection lost', 'कनेक्शन टूट गया', 'Connection lost'),
  type: t3('Type a message', 'संदेश लिखिए', 'Message likhiye'), send: t3('Send', 'भेजिए', 'Send'), disc: t3('Disconnect', 'अलग कीजिए', 'Disconnect'),
  nets: t3('WiFi networks', 'WiFi नेटवर्क', 'WiFi networks'), conn: t3('Connected', 'जुड़ा है', 'Juda hai'), pass: t3('Password for {n}', '{n} का पासवर्ड', '{n} ka password'),
  wrongPass: t3('Wrong password', 'ग़लत पासवर्ड', 'Galat password'), espNet: t3('the ESP32\'s own network', 'ESP32 का अपना नेटवर्क', 'ESP32 ka apna network'),
  sticker: t3('WiFi: {s}  ·  Password: {p}', 'WiFi: {s}  ·  पासवर्ड: {p}', 'WiFi: {s}  ·  Password: {p}'),
};

// ------------------------------------------------------------------ a small HTML renderer (what an ESP32 page needs)
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', deg: '°', copy: '©', middot: '·', ndash: '–', mdash: '—', times: '×', hellip: '…', rarr: '→', larr: '←', bull: '•' };
const ent = (s) => String(s).replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, k) => (k[0] === '#' ? String.fromCodePoint(k[1] === 'x' || k[1] === 'X' ? parseInt(k.slice(2), 16) : +k.slice(1)) : ENT[k.toLowerCase()] !== undefined ? ENT[k.toLowerCase()] : m));
function attrsOf(s) { const a = {}; s.replace(/([\w:-]+)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g, (m, k, v, d, q, u) => { a[k.toLowerCase()] = ent(d !== undefined ? d : q !== undefined ? q : u !== undefined ? u : ''); return ''; }); return a; }
const VOID = new Set(['br', 'hr', 'meta', 'img', 'input', 'link', 'rect', 'line', 'circle', 'polyline', 'polygon', 'path', 'source']);
// HTML -> a tree of { tag, a: attrs, kids: [...] } and text strings
export function parseHTML(html) {
  const root = { tag: 'root', a: {}, kids: [] }; const stack = [root]; let s = String(html || '');
  s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)[^>]*>[\s\S]*?<\/\1\s*>/gi, (m, t) => (t.toLowerCase() === 'style' ? '' : '')).replace(/<!doctype[^>]*>/gi, '');
  const re = /<\/?([a-zA-Z][\w-]*)([^>]*?)(\/?)>|([^<]+)/g; let m;
  while ((m = re.exec(s))) {
    const top = stack[stack.length - 1];
    if (m[4] !== undefined) { if (m[4].trim() || /\S/.test(m[4]) || m[4].includes(' ')) top.kids.push(ent(m[4])); continue; }
    const tag = m[1].toLowerCase();
    if (m[0][1] === '/') { for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === tag) { stack.length = i; break; } continue; }
    const el = { tag, a: attrsOf(m[2]), kids: [] }; top.kids.push(el);
    if (!VOID.has(tag) && !m[3]) stack.push(el);
  }
  return root;
}
const findAll = (n, tag, out = []) => { if (typeof n === 'string') return out; if (n.tag === tag) out.push(n); for (const k of n.kids) findAll(k, tag, out); return out; };
const textOf = (n) => (typeof n === 'string' ? n : n.kids.map(textOf).join(''));
const styleOf = (el) => { const o = {}; String(el.a.style || '').split(';').forEach((kv) => { const i = kv.indexOf(':'); if (i > 0) o[kv.slice(0, i).trim().toLowerCase()] = kv.slice(i + 1).trim(); }); return o; };
const COLORS = { red: '#e03131', green: '#2f9e44', blue: '#1971c2', orange: '#f08c00', black: '#111', white: '#fff', gray: '#868e96', grey: '#868e96', yellow: '#fab005', purple: '#7048e8', navy: '#1c2e6e', teal: '#0c8599', maroon: '#862e2e', pink: '#e64980', lime: '#82c91e', brown: '#8a5a32', cyan: '#15aabf' };
const col = (c, d) => { if (!c) return d; c = String(c).trim(); return COLORS[c.toLowerCase()] || (/^#|^rgb|^hsl/i.test(c) ? c : d); };
// where a tap on an element goes: a link, location.href = '…', fetch('…')
function actionOf(el, linkHref) {
  if (linkHref) return { href: linkHref };
  const oc = String(el.a.onclick || '');
  let m = /location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/.exec(oc); if (m) return { href: m[1] };
  m = /fetch\(\s*['"]([^'"]+)['"]/.exec(oc); if (m) return { fetch: m[1] };
  m = /(?:XMLHttpRequest|xhr)[\s\S]*open\(\s*['"]GET['"]\s*,\s*['"]([^'"]+)['"]/.exec(oc); if (m) return { fetch: m[1] };
  if (el.tag === 'button' && el.a.formaction) return { href: el.a.formaction };
  return null;
}
// lay a page out for a width (px of the screen); returns { h, title, refresh, bg, draw(ctx, y0), hits: [{ x, y, w, h, act }] }
export function layoutHTML(html, width, isText) {
  const root = isText ? { tag: 'root', a: {}, kids: [{ tag: 'pre', a: {}, kids: [String(html)] }] } : parseHTML(html);
  const ops = []; const hits = []; const pad = 22; let y = 18; let line = []; let lineH = 0; let x = pad; const W = width - pad * 2;
  let title = ''; let refresh = null; let bg = '#ffffff';
  for (const t of findAll(root, 'title')) title = textOf(t).trim();
  for (const mt of findAll(root, 'meta')) if (/refresh/i.test(mt.a['http-equiv'] || '')) { const c = String(mt.a.content || ''); const n = parseFloat(c); const u = /url\s*=\s*(\S+)/i.exec(c); refresh = { s: Number.isFinite(n) ? Math.max(0.5, n) : 1, url: u ? u[1].replace(/['"]/g, '') : null }; }
  for (const b of findAll(root, 'body')) { const st = styleOf(b); bg = col(st['background-color'] || st.background || b.a.bgcolor, bg); }
  const flush = (align) => {
    if (!line.length) return;
    const lw = line.reduce((s, r) => s + r.w, 0); const off = align === 'center' ? (W - lw) / 2 : align === 'right' ? W - lw : 0;
    let cx = pad + Math.max(0, off); const base = y + lineH * 0.78;
    for (const r of line) { r.draw(cx, y, base, lineH); if (r.act) hits.push({ x: cx, y, w: r.w, h: lineH, act: r.act }); cx += r.w; }
    y += lineH; line = []; lineH = 0; x = pad;
  };
  const meas = (() => { const c = document.createElement('canvas').getContext('2d'); return (font, s) => { c.font = font; return c.measureText(s).width; }; })();
  const fontOf = (st) => `${st.i ? 'italic ' : ''}${st.b ? 700 : 400} ${st.size}px ${st.mono ? '"IBM Plex Mono", monospace' : FONT}`;
  const pushText = (s, st, align) => {
    const font = fontOf(st); const words = st.pre ? [s] : s.split(/(\s+)/);
    for (let w of words) {
      if (!w) continue; if (!st.pre && /^\s+$/.test(w)) { if (!line.length) continue; w = ' '; }
      let ww = meas(font, w);
      if (x + ww > pad + W && line.length && w !== ' ') flush(align);
      if (w === ' ' && !line.length) continue;
      const lh = st.size * 1.35; lineH = Math.max(lineH, lh); const color = st.color, deco = st.u, act = st.act;
      line.push({ w: ww, act, draw: (cx, cy, base) => ops.push((c, oy) => { c.font = font; c.fillStyle = color; c.textBaseline = 'alphabetic'; c.fillText(w, cx, base + oy); if (deco) c.fillRect(cx, base + oy + 3, ww, 2); }) });
      x += ww;
    }
  };
  const block = (fn, mt = 6, mb = 6, align) => { flush(align); y += mt; fn(); flush(align); y += mb; };
  const walk = (n, st, align) => {
    if (typeof n === 'string') { pushText(st.pre ? n : n.replace(/\s+/g, ' '), st, align); return; }
    const t = n.tag; const ss = styleOf(n); const s2 = Object.assign({}, st);
    if (ss.color || n.a.color) s2.color = col(ss.color || n.a.color, st.color);
    if (ss['font-size']) { const v = parseFloat(ss['font-size']); if (v) s2.size = /em|rem/.test(ss['font-size']) ? st.size * v : v * 1.3; }
    if (ss['font-weight'] && /bold|[6-9]00/.test(ss['font-weight'])) s2.b = true;
    const al = ss['text-align'] || n.a.align || (t === 'center' ? 'center' : align);
    switch (t) {
      case 'head': case 'title': case 'meta': case 'link': case 'script': case 'style': return;
      case 'br': flush(align); if (!lineH) y += st.size * 1.2; return;
      case 'hr': block(() => ops.push(((yy) => (c, oy) => { c.fillStyle = '#ced4da'; c.fillRect(pad, yy + oy, W, 2); })(y)), 8, 10); return;
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': { const k = +t[1]; s2.size = [0, 44, 36, 30, 26, 23, 21][k]; s2.b = true; block(() => n.kids.forEach((c) => walk(c, s2, al)), k <= 2 ? 10 : 8, k <= 2 ? 10 : 6, al); return; }
      case 'p': case 'div': case 'section': case 'article': case 'header': case 'footer': case 'main': case 'nav': case 'form': case 'center': case 'body': case 'html': case 'ul': case 'ol': case 'table': case 'tr': {
        const bgc = col(ss['background-color'] || ss.background || n.a.bgcolor, null); const y0 = y;
        const fn = () => n.kids.forEach((c) => walk(c, s2, al));
        if (bgc && t !== 'body' && t !== 'html') { const i = ops.length; block(fn, t === 'p' ? 8 : 4, t === 'p' ? 8 : 4, al); const yy = y0, hh = y - y0; ops.splice(i, 0, (c, oy) => { c.fillStyle = bgc; c.fillRect(pad - 8, yy + oy, W + 16, hh); }); }
        else block(fn, t === 'p' ? 8 : t === 'table' || t === 'tr' ? 2 : 0, t === 'p' ? 8 : t === 'tr' ? 2 : 0, al);
        return;
      }
      case 'li': block(() => { pushText('•  ', s2, al); n.kids.forEach((c) => walk(c, s2, al)); }, 2, 2, al); return;
      case 'td': case 'th': { if (t === 'th') s2.b = true; n.kids.forEach((c) => walk(c, s2, al)); pushText('   ', s2, al); return; }
      case 'pre': case 'code': case 'tt': { s2.mono = true; s2.size = st.size * 0.86; if (t === 'pre') { s2.pre = true; block(() => { for (const ln of textOf(n).split('\n')) { pushText(ln, s2, al); flush(al); } }, 6, 6, al); return; } break; }
      case 'b': case 'strong': s2.b = true; break;
      case 'i': case 'em': s2.i = true; break;
      case 'small': s2.size = st.size * 0.82; break;
      case 'big': s2.size = st.size * 1.2; break;
      case 'font': if (n.a.size) s2.size = [0, 16, 19, 22, 26, 32, 40, 52][Math.max(1, Math.min(7, +n.a.size))] * 1.1; break;
      case 'a': { s2.color = '#1864ab'; s2.u = true; s2.link = n.a.href || null; s2.act = n.a.href ? { href: n.a.href } : null; break; }
      case 'button': case 'input': {
        if (t === 'input' && !/button|submit/i.test(n.a.type || '')) { pushText('[' + (n.a.value || n.a.placeholder || '') + ']', s2, al); return; }
        const label = t === 'input' ? n.a.value || 'OK' : textOf(n).trim() || ' ';
        const act = actionOf(n, st.link); const bgc = col(ss['background-color'] || ss.background, '#1971c2'); const fg = col(ss.color, '#ffffff');
        const font = `700 ${st.size * 1.05}px ${FONT}`; const tw = meas(font, label); const bw = Math.max(110, tw + 44), bh = st.size * 2.3;
        if (x + bw > pad + W && line.length) flush(al);
        lineH = Math.max(lineH, bh + 10);
        line.push({ w: bw + 12, act, draw: (cx, cy, base, lh) => ops.push((c, oy) => { const by = cy + oy + (lh - bh) / 2; c.fillStyle = bgc; rrect(c, cx, by, bw, bh, 14); c.fill(); c.fillStyle = fg; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, cx + bw / 2, by + bh / 2 + 1); c.textAlign = 'left'; }) });
        x += bw + 12; return;
      }
      case 'img': pushText('[' + (n.a.alt || 'image') + ']', Object.assign({}, s2, { color: '#868e96' }), al); return;
      case 'svg': { // drawn as it is, scaled to fit the width
        flush(al); const sw = parseFloat(n.a.width) || 300, sh = parseFloat(n.a.height) || 150; const vb = String(n.a.viewbox || '').split(/[\s,]+/).map(Number);
        const k = Math.min(W / sw, 2.2) * (sw * 1.3 > W ? W / (sw * 1.3) : 1) * 1.3; const ox = pad + (al === 'center' ? (W - sw * k) / 2 : 0), yy = y + 6;
        const sx = vb.length === 4 && vb[2] ? sw * k / vb[2] : k, sy = vb.length === 4 && vb[3] ? sh * k / vb[3] : k; const vx = vb.length === 4 ? vb[0] : 0, vy = vb.length === 4 ? vb[1] : 0;
        const kids = []; const gather = (e) => { for (const q of e.kids) if (typeof q !== 'string') { kids.push(q); if (q.tag === 'g') gather(q); } }; gather(n);
        ops.push((c, oy) => {
          c.save(); c.beginPath(); c.rect(ox, yy + oy, sw * k, sh * k); c.clip();
          const X = (v) => ox + (v - vx) * sx, Y = (v) => yy + oy + (v - vy) * sy;
          for (const e of kids) {
            const a = e.a; const fill = a.fill === 'none' ? null : col(a.fill, e.tag === 'line' || e.tag === 'polyline' ? null : '#000'); const stroke = a.stroke && a.stroke !== 'none' ? col(a.stroke, '#000') : null; c.lineWidth = (parseFloat(a['stroke-width']) || 1) * Math.min(sx, sy); c.lineJoin = 'round'; c.lineCap = 'round';
            const paint = () => { if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.stroke(); } };
            if (e.tag === 'rect') { c.beginPath(); c.rect(X(+a.x || 0), Y(+a.y || 0), (+a.width || 0) * sx, (+a.height || 0) * sy); paint(); }
            if (e.tag === 'circle') { c.beginPath(); c.arc(X(+a.cx || 0), Y(+a.cy || 0), (+a.r || 0) * Math.min(sx, sy), 0, 7); paint(); }
            if (e.tag === 'line') { c.beginPath(); c.moveTo(X(+a.x1 || 0), Y(+a.y1 || 0)); c.lineTo(X(+a.x2 || 0), Y(+a.y2 || 0)); if (stroke) { c.strokeStyle = stroke; c.stroke(); } }
            if (e.tag === 'polyline' || e.tag === 'polygon') { const v = String(a.points || '').trim().split(/[\s,]+/).map(Number); c.beginPath(); for (let i = 0; i + 1 < v.length; i += 2) { if (!Number.isFinite(v[i]) || !Number.isFinite(v[i + 1])) continue; if (i) c.lineTo(X(v[i]), Y(v[i + 1])); else c.moveTo(X(v[i]), Y(v[i + 1])); } if (e.tag === 'polygon') c.closePath(); paint(); }
            if (e.tag === 'text') { c.fillStyle = col(a.fill, '#111'); c.font = `600 ${(parseFloat(a['font-size']) || 14) * Math.min(sx, sy)}px ${FONT}`; c.textAlign = a['text-anchor'] === 'middle' ? 'center' : a['text-anchor'] === 'end' ? 'right' : 'left'; c.fillText(textOf(e), X(+a.x || 0), Y(+a.y || 0)); c.textAlign = 'left'; }
          }
          c.restore();
        });
        y += sh * k + 12; return;
      }
    }
    n.kids.forEach((c) => walk(c, s2, al));
  };
  walk(root, { size: 21, color: '#212529', b: false }, 'left'); flush('left');
  return { h: y + 20, title, refresh, bg, hits, draw(c, oy) { for (const f of ops) f(c, oy); } };
}
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

// ------------------------------------------------------------------ the phone
export class Phone {
  constructor(app, tx) {
    this.app = app; this.tx = tx; this.lab = app.lab; this.appId = 'home'; this.dirty = true; this.items = [];
    this.url = ''; this.page = null; this.loading = null; this.err = null; this.hist = []; this.scroll = 0; this.kb = null; this.reloadAt = 0; this.wifiMsg = '';
    this.lite = !!app.stage.lite;
    this.canvas = document.createElement('canvas'); const k = this.lite ? 0.72 : 1; this.canvas.width = Math.round(SW * k); this.canvas.height = Math.round(SH * k); this.k = k;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    this.obj = this.build(); this.lastV = -1; this.t = 0;
  }
  get net() { return netOf(this.app.lab); }
  // ------------------------------------------------------------ the 3D phone, on a stand, screen to the student
  build() {
    materials(); const g = new THREE.Group(); g.name = 'phone4';
    const W = 75, H = 160, D = 8.2, r = 9;
    const sh = new THREE.Shape(); sh.moveTo(-W / 2 + r, -H / 2); sh.lineTo(W / 2 - r, -H / 2); sh.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r); sh.lineTo(W / 2, H / 2 - r); sh.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2); sh.lineTo(-W / 2 + r, H / 2); sh.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r); sh.lineTo(-W / 2, -H / 2 + r); sh.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: D - 2, bevelEnabled: true, bevelThickness: 1, bevelSize: 1, bevelSegments: 3, curveSegments: 10 }),
      [new THREE.MeshStandardMaterial({ color: 0x22252b, metalness: 0.2, roughness: 0.35 }), new THREE.MeshStandardMaterial({ color: 0x3a3e46, metalness: 0.9, roughness: 0.3 })]);
    body.position.z = -D / 2 + 1; const hold = new THREE.Group(); hold.add(body);
    const glass = new THREE.Mesh(new THREE.ShapeGeometry(sh, 10), new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.08, metalness: 0.1 })); glass.position.z = D / 2 + 0.02; hold.add(glass);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(W - 6, (W - 6) * SH / SW), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false })); scr.position.set(0, -1, D / 2 + 0.06);
    scr.userData.region = (h) => 'phone@' + (h.uv ? h.uv.x.toFixed(4) + ',' + h.uv.y.toFixed(4) : '0.5,0.5'); scr.name = 'screen'; hold.add(scr); this.screen = scr;
    const cam = new THREE.Mesh(new THREE.CircleGeometry(2.2, 16), new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.1, metalness: 0.5 })); cam.position.set(0, H / 2 - 6.5, D / 2 + 0.08); hold.add(cam);
    for (const [y, h] of [[38, 18], [12, 26]]) hold.add(box(1.4, h, 3, new THREE.MeshStandardMaterial({ color: 0x3a3e46, metalness: 0.9, roughness: 0.3 }), W / 2 + 0.6, y, 0));
    // the stand: a base, a back and a lip
    const sm = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.85, roughness: 0.38 });
    g.add(box(70, 3, 62, sm, 0, 1.5, -12)); const back = box(64, 3, 92, sm, 0, 0, 0); back.rotation.x = -Math.PI / 2 + 0.33; back.position.set(0, 44, -26); g.add(back);
    g.add(box(70, 9, 4, sm, 0, 4.5, 16));
    hold.rotation.x = -0.33; hold.position.set(0, H / 2 * Math.cos(0.33) + 6, 12 - H / 2 * Math.sin(0.33) + 2); g.add(hold);
    g.traverse((o) => { if (o.isMesh) { o.castShadow = o !== scr; o.receiveShadow = true; } });
    return g;
  }
  // ------------------------------------------------------------ apps and taps
  reset() { this.appId = 'home'; this.url = ''; this.page = null; this.loading = null; this.err = null; this.scroll = 0; this.kb = null; this.reloadAt = 0; this.wifiMsg = ''; this.dirty = true; } // a new lesson: the home screen (the history stays, as on a real phone)
  open(id) { this.appId = id; this.kb = null; this.scroll = 0; this.dirty = true; if (id === 'browser' && !this.url && this.hist.length) this.url = this.hist[0]; }
  tap(u, v) { const x = u * SW, y = (1 - v) * SH; for (let k = this.items.length - 1; k >= 0; k--) { const it = this.items[k]; if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) { it.act(); this.dirty = true; this.app.sound.click(); return it.id || true; } } return false; }
  find(id) { this.draw(true); return this.items.find((q) => q.id === id) || null; }
  press(id) { const it = this.find(id); if (!it) return false; it.act(); this.dirty = true; return true; } // tests: tap an item by its id
  go(url) {
    let u = String(url || '').trim(); if (!u) return; if (!/^https?:\/\//i.test(u)) u = 'http://' + u; this.url = u; this.kb = null; this.appId = 'browser';
    this.hist = [u, ...this.hist.filter((h) => h !== u)].slice(0, 4); this.err = null; this.loading = { url: u, t: this.t }; this.dirty = true;
    const host = parseUrl(u).host; const myLoad = this.loading;
    this.net.request(u, (r) => {
      if (this.loading !== myLoad) return; this.loading = null; this.dirty = true;
      if (r.error) { this.err = { kind: r.error, host }; this.page = null; return; }
      if (r.headers && r.headers.Location && (r.code === 301 || r.code === 302 || r.code === 303)) { const L = r.headers.Location; this.go(/^https?:/.test(L) ? L : 'http://' + host + (L[0] === '/' ? L : '/' + L)); return; }
      if (r.code === 0) { this.err = { kind: 'empty', host }; this.page = null; return; }
      this.page = layoutHTML(r.body, SW, !/html/i.test(r.type || ''));
      this.page.code = r.code; this.scroll = Math.min(this.scroll, Math.max(0, this.page.h - 860));
      this.reloadAt = this.page.refresh ? this.t + this.page.refresh.s : 0;
    });
  }
  follow(act) {
    if (!act) return; const base = parseUrl(this.url); const abs = (h) => (/^https?:\/\//i.test(h) ? h : 'http://' + base.host + (h[0] === '/' ? h : '/' + h));
    if (act.href) this.go(abs(act.href)); else if (act.fetch) this.net.request(abs(act.fetch), () => { this.dirty = true; });
  }
  key(k) {
    const kb = this.kb; if (!kb) return;
    if (k === '⌫') kb.text = kb.text.slice(0, -1); else if (k === 'Go') { const f = kb.done; this.kb = null; f(kb.text); } else if (k === 'space') kb.text += ' '; else kb.text += k;
    this.dirty = true;
  }
  update(dt) { // called each frame: page reloads, the clock, and whether the screen must be drawn again
    this.t += dt;
    if (this.appId === 'browser' && this.page && this.reloadAt && this.t >= this.reloadAt && !this.loading && !this.kb) { this.reloadAt = 0; const u = this.page.refresh && this.page.refresh.url; this.go(u ? (/^https?:/.test(u) ? u : 'http://' + parseUrl(this.url).host + u) : this.url); }
    const v = this.net.ver; if (v !== this.lastV) { this.lastV = v; this.dirty = true; }
    if (this.loading && Math.floor(this.t * 4) !== this._lt) { this._lt = Math.floor(this.t * 4); this.dirty = true; }
    const m = new Date().getMinutes(); if (m !== this._min) { this._min = m; this.dirty = true; }
    if (this.dirty) { this.draw(); return true; } return false;
  }
  // ------------------------------------------------------------ drawing the screen (and the list of things a tap can hit)
  draw(force) {
    if (!this.dirty && !force) return; this.dirty = false;
    const c = this.ctx; c.setTransform(this.k, 0, 0, this.k, 0, 0); this.items = [];
    const T = (o, a) => this.tx(o, a); const btn = (id, x, y, w, h, act) => this.items.push({ id, x, y, w, h, act });
    c.fillStyle = '#0f1115'; c.fillRect(0, 0, SW, SH);
    if (this.appId === 'home') this.drawHome(c, T, btn); else if (this.appId === 'browser') this.drawBrowser(c, T, btn); else if (this.appId === 'bt') this.drawBT(c, T, btn); else this.drawWifi(c, T, btn);
    if (this.kb) this.drawKeyboard(c, T, btn);
    // the status bar and the navigation bar
    c.fillStyle = this.appId === 'home' ? 'rgba(0,0,0,0)' : '#0f1115'; c.fillRect(0, 0, SW, 46);
    const d = new Date(); c.fillStyle = '#f1f3f5'; c.font = `600 22px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillText(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), 26, 25);
    c.textAlign = 'right'; c.fillText('▮▮▮▮ ' + (this.net.phone.wifi ? '📶 ' + this.net.phone.wifi : '') + '  🔋 82%', SW - 22, 25); c.textAlign = 'left';
    c.fillStyle = '#0b0c0f'; c.fillRect(0, SH - 70, SW, 70); c.fillStyle = '#ced4da';
    c.font = `600 34px ${FONT}`; c.textAlign = 'center'; c.fillText('◀', 135, SH - 35); c.fillText('●', 270, SH - 35); c.fillText('■', 405, SH - 35); c.textAlign = 'left';
    btn('back', 60, SH - 70, 150, 70, () => { if (this.kb) this.kb = null; else if (this.appId === 'browser' && this.hist.length > 1) { this.hist.shift(); this.go(this.hist.shift()); } else this.open('home'); });
    btn('home', 195, SH - 70, 150, 70, () => this.open('home'));
    this.tex.needsUpdate = true; if (this.app.stage) this.app.stage.kick();
  }
  drawHome(c, T, btn) {
    const g = c.createLinearGradient(0, 0, SW, SH); g.addColorStop(0, '#1b3a6b'); g.addColorStop(0.55, '#0e6e72'); g.addColorStop(1, '#122b3a'); c.fillStyle = g; c.fillRect(0, 0, SW, SH);
    const d = new Date(); c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.font = `300 110px ${FONT}`; c.fillText(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), SW / 2, 230);
    c.font = `500 26px ${FONT}`; c.fillText('DUET STEM · ' + d.toDateString().slice(0, 10), SW / 2, 300);
    const apps = [['browser', '🌐', PW.browser, '#1971c2'], ['bt', 'ᛒ', PW.bt, '#2b8a3e'], ['wifi', '📶', PW.wifi, '#5f3dc4']];
    apps.forEach(([id, ic, name, colr], i) => {
      const x = 60 + i * 160, y = 640; c.fillStyle = colr; rrect(c, x, y, 120, 120, 30); c.fill();
      c.fillStyle = '#fff'; c.font = `700 60px ${FONT}`; c.textBaseline = 'middle'; c.fillText(ic, x + 60, y + 62); c.font = `600 22px ${FONT}`; c.fillText(T(name), x + 60, y + 150);
      btn('app:' + id, x - 10, y - 10, 140, 180, () => this.open(id));
    });
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  }
  drawBrowser(c, T, btn) {
    c.fillStyle = '#f1f3f5'; c.fillRect(0, 46, SW, 96);
    c.fillStyle = '#ffffff'; rrect(c, 18, 60, SW - 130, 66, 33); c.fill(); c.strokeStyle = this.kb ? '#1971c2' : '#ced4da'; c.lineWidth = 3; c.stroke();
    const shown = this.kb ? this.kb.text + (Math.floor(this.t * 2) % 2 ? '|' : '') : this.url.replace(/^http:\/\//, '') || '';
    c.fillStyle = shown ? '#212529' : '#868e96'; c.font = `500 25px ${FONT}`; c.textBaseline = 'middle'; c.fillText(shown || T(PW.addr), 44, 93, SW - 180);
    btn('addr', 18, 60, SW - 130, 66, () => { this.kb = { text: this.url.replace(/^http:\/\//, ''), done: (s) => this.go(s) }; });
    c.fillStyle = '#1971c2'; rrect(c, SW - 100, 60, 82, 66, 33); c.fill(); c.fillStyle = '#fff'; c.font = `700 25px ${FONT}`; c.textAlign = 'center'; c.fillText(this.kb ? T(PW.go) : '⟳', SW - 59, 94); c.textAlign = 'left';
    btn('go', SW - 100, 60, 82, 66, () => { if (this.kb) this.key('Go'); else if (this.url) this.go(this.url); });
    const top = 142, bottom = this.kb ? 700 : SH - 70; const ph = bottom - top;
    if (this.loading) { c.fillStyle = '#1971c2'; c.fillRect(0, top, SW * (0.25 + 0.6 * ((this.t - this.loading.t) % 1.5) / 1.5), 5); }
    if (!this.url && !this.hist.length) { c.fillStyle = '#495057'; c.font = `500 24px ${FONT}`; this.wrap(c, T(PW.addr) + ': 192.168.1.…', 40, top + 80, SW - 80, 34); }
    if (this.hist.length && this.kb) { this.hist.slice(0, 3).forEach((h, i) => { const y = top + 16 + i * 70; c.fillStyle = '#e9ecef'; rrect(c, 18, y, SW - 36, 58, 14); c.fill(); c.fillStyle = '#343a40'; c.font = `500 23px ${FONT}`; c.fillText('🕘  ' + h.replace(/^http:\/\//, ''), 36, y + 30); btn('hist' + i, 18, y, SW - 36, 58, () => this.go(h)); }); return; }
    if (this.err) {
      c.fillStyle = '#ffffff'; c.fillRect(0, top, SW, ph); c.fillStyle = '#495057'; c.font = `700 30px ${FONT}`; c.fillText('☹  ' + T(PW.noReach), 30, top + 80);
      c.font = `400 23px ${FONT}`; this.wrap(c, T(PW[this.err.kind === 'name' ? 'name' : this.err.kind === 'refused' ? 'refused' : this.err.kind === 'empty' ? 'empty' : 'timeout'], { h: this.err.host }), 30, top + 140, SW - 60, 32);
      return;
    }
    if (this.page) {
      const p = this.page; c.save(); c.beginPath(); c.rect(0, top + 5, SW, ph - 5); c.clip(); c.fillStyle = p.bg; c.fillRect(0, top + 5, SW, ph);
      const oy = top + 5 - this.scroll; p.draw(c, oy); c.restore();
      for (const h of p.hits) { const y = h.y + oy; if (y + h.h < top || y > bottom) continue; btn('link:' + (h.act.href || h.act.fetch), h.x, Math.max(top, y), h.w, Math.min(bottom, y + h.h) - Math.max(top, y), () => this.follow(h.act)); }
      if (p.h > ph) { // scroll buttons
        c.fillStyle = 'rgba(33,37,41,0.55)'; for (const [id, y, s] of [['up', top + 12, -1], ['down', bottom - 72, 1]]) { rrect(c, SW - 70, y, 56, 56, 28); c.fill(); }
        c.fillStyle = '#fff'; c.font = `700 26px ${FONT}`; c.textAlign = 'center'; c.fillText('▲', SW - 42, top + 41); c.fillText('▼', SW - 42, bottom - 43); c.textAlign = 'left';
        btn('up', SW - 70, top + 12, 56, 56, () => { this.scroll = Math.max(0, this.scroll - 300); }); btn('down', SW - 70, bottom - 72, 56, 56, () => { this.scroll = Math.min(p.h - ph + 20, this.scroll + 300); });
      }
    }
  }
  drawBT(c, T, btn) {
    const N = this.net, b = N.bt; c.fillStyle = '#2b8a3e'; c.fillRect(0, 46, SW, 96); c.fillStyle = '#fff'; c.font = `700 30px ${FONT}`; c.textBaseline = 'middle'; c.fillText('ᛒ  ' + T(PW.bt), 26, 80);
    c.font = `500 21px ${FONT}`; c.fillText(b.conn ? T(PW.connected, { n: b.conn }) : T(PW.notConn), 28, 118);
    if (b.conn) { c.fillStyle = 'rgba(255,255,255,0.2)'; rrect(c, SW - 190, 66, 170, 50, 25); c.fill(); c.fillStyle = '#fff'; c.font = `600 21px ${FONT}`; c.textAlign = 'center'; c.fillText(T(PW.disc), SW - 105, 92); c.textAlign = 'left'; btn('bt:disc', SW - 190, 66, 170, 50, () => N.btDisconnect()); }
    const top = 150;
    if (!b.conn) {
      c.fillStyle = '#adb5bd'; c.font = `600 22px ${FONT}`; c.fillText(T(PW.devices).toUpperCase(), 28, top + 30);
      const devs = N.btDevices();
      if (!devs.length) { c.fillStyle = '#ced4da'; c.font = `400 23px ${FONT}`; this.wrap(c, T(PW.noDev), 28, top + 90, SW - 56, 32); }
      devs.forEach((d, i) => { const y = top + 60 + i * 100; c.fillStyle = '#1c1f25'; rrect(c, 18, y, SW - 36, 86, 16); c.fill(); c.fillStyle = '#f1f3f5'; c.font = `700 27px ${FONT}`; c.fillText('ᛒ  ' + d, 40, y + 32); c.fillStyle = '#8ce99a'; c.font = `500 20px ${FONT}`; c.fillText(T(PW.tapConnect), 72, y + 64); btn('bt:dev:' + d, 18, y, SW - 36, 86, () => N.btConnect(d)); });
      if (b.log.length && b.log[b.log.length - 1].sys === 'lost') { c.fillStyle = '#ff8787'; c.font = `600 22px ${FONT}`; c.fillText('⚠ ' + T(PW.lost), 28, top + 380); }
      return;
    }
    // the log: the newest lines at the bottom
    const bottom = this.kb ? 700 : SH - 230; const lines = b.log.slice(-60); let y = bottom - 16; c.font = `500 23px "IBM Plex Mono", monospace`;
    for (let i = lines.length - 1; i >= 0 && y > top + 20; i--) { const L = lines[i]; const txt = L.sys ? (L.sys === 'conn' ? '— ' + T(PW.connected, { n: L.name }) + ' —' : '— ' + T(PW.lost) + ' —') : (L.me ? '› ' : '') + L.text; c.fillStyle = L.sys ? '#868e96' : L.me ? '#74c0fc' : '#8ce99a'; c.fillText(txt.slice(0, 34), 26, y); y -= 34; }
    if (this.kb) return;
    // the macro buttons (as in the real app: M1, M2 …), and a field for your own text
    const macros = [['1', '1'], ['0', '0'], ['2', '2'], ['Hi', 'Hello']]; macros.forEach(([lab, val], i) => { const x = 18 + i * 128, yy = SH - 222; c.fillStyle = '#2b8a3e'; rrect(c, x, yy, 116, 74, 14); c.fill(); c.fillStyle = '#fff'; c.font = `700 32px ${FONT}`; c.textAlign = 'center'; c.fillText(lab, x + 58, yy + 39); c.textAlign = 'left'; btn('bt:send:' + val, x, yy, 116, 74, () => N.btSend(val)); });
    c.fillStyle = '#1c1f25'; rrect(c, 18, SH - 136, SW - 36, 58, 29); c.fill(); c.fillStyle = '#868e96'; c.font = `500 23px ${FONT}`; c.fillText(T(PW.type), 42, SH - 106);
    btn('bt:type', 18, SH - 136, SW - 36, 58, () => { this.kb = { text: '', done: (s) => { if (s) N.btSend(s); } }; });
  }
  drawWifi(c, T, btn) {
    const N = this.net; c.fillStyle = '#5f3dc4'; c.fillRect(0, 46, SW, 96); c.fillStyle = '#fff'; c.font = `700 30px ${FONT}`; c.textBaseline = 'middle'; c.fillText('📶  ' + T(PW.nets), 26, 94);
    N.networks().forEach((n, i) => {
      const y = 170 + i * 104; const on = N.phone.wifi === n.ssid; c.fillStyle = on ? '#2b2440' : '#1c1f25'; rrect(c, 18, y, SW - 36, 90, 16); c.fill();
      c.fillStyle = '#f1f3f5'; c.font = `700 26px ${FONT}`; c.fillText((n.lock ? '🔒 ' : '') + n.ssid, 40, y + 32); c.font = `500 20px ${FONT}`; c.fillStyle = on ? '#b197fc' : '#adb5bd';
      c.fillText(on ? T(PW.conn) : n.esp ? T(PW.espNet) : '', 40, y + 66); c.textAlign = 'right'; c.fillText('▂▄▆█'.slice(0, n.bars), SW - 40, y + 46); c.textAlign = 'left';
      btn('wifi:' + n.ssid, 18, y, SW - 36, 90, () => {
        if (on) return; this.wifiMsg = '';
        if (n.ssid === SCHOOL.ssid) { N.join(n.ssid); return; }
        if (!n.lock) { N.join(n.ssid, ''); return; }
        this.kb = { text: '', label: T(PW.pass, { n: n.ssid }), done: (s) => { const r = N.join(n.ssid, s); this.wifiMsg = r === 'ok' ? '' : T(PW.wrongPass); } };
      });
    });
    if (this.wifiMsg) { c.fillStyle = '#ff8787'; c.font = `600 23px ${FONT}`; c.fillText('⚠ ' + this.wifiMsg, 28, 520); }
  }
  drawKeyboard(c, T, btn) {
    const y0 = 700, rows = ['1234567890', 'qwertyuiop', 'asdfghjkl.', 'zxcvbnm/:⌫', ['-', '_', '?', '=', 'space', '&', 'Go']];
    c.fillStyle = '#212529'; c.fillRect(0, y0 - 66, SW, SH - 70 - y0 + 66);
    if (this.kb.label) { c.fillStyle = '#ced4da'; c.font = `600 21px ${FONT}`; c.textBaseline = 'middle'; c.fillText(this.kb.label, 22, y0 - 46); c.fillStyle = '#fff'; c.font = `500 24px ${FONT}`; c.fillText(this.kb.text + '|', 22, y0 - 16); }
    rows.forEach((r, j) => {
      const keys = typeof r === 'string' ? [...r] : r; let x = 4; const kw = (SW - 8) / 10;
      for (const k of keys) {
        const w = k === 'space' ? kw * 2.6 : k === 'Go' ? kw * 1.4 : kw; const y = y0 + j * 74 + 4;
        c.fillStyle = k === 'Go' ? '#1971c2' : k === '⌫' ? '#495057' : '#343a40'; rrect(c, x + 3, y, w - 6, 66, 10); c.fill();
        c.fillStyle = '#f8f9fa'; c.font = `${k.length > 1 ? 600 : 500} ${k.length > 1 ? 22 : 30}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(k === 'space' ? '␣' : k === 'Go' ? T(PW.go) : k, x + w / 2, y + 34); c.textAlign = 'left';
        btn('key:' + k, x, y, w, 70, () => this.key(k)); x += w;
      }
    });
  }
  wrap(c, s, x, y, w, lh) { const words = String(s).split(' '); let ln = ''; for (const wd of words) { const t = ln ? ln + ' ' + wd : wd; if (c.measureText(t).width > w && ln) { c.fillText(ln, x, y); y += lh; ln = wd; } else ln = t; } if (ln) c.fillText(ln, x, y); return y; }
}

// ------------------------------------------------------------------ the school's WiFi router (its sticker has the password)
export function buildRouter(tx) {
  materials(); const g = new THREE.Group(); g.name = 'router4';
  const white = new THREE.MeshStandardMaterial({ color: 0xeef0f2, roughness: 0.42 });
  const C = document.createElement('canvas'); C.width = 512; C.height = 256; const c = C.getContext('2d');
  c.fillStyle = '#f8f9fa'; c.fillRect(0, 0, 512, 256); c.strokeStyle = '#adb5bd'; c.lineWidth = 6; c.strokeRect(8, 8, 496, 240);
  c.fillStyle = '#212529'; c.textAlign = 'center'; c.font = `800 40px ${FONT}`; c.fillText('DUET-School', 256, 70); c.font = `600 30px ${FONT}`; c.fillText('WiFi: ' + SCHOOL.ssid, 256, 128); c.fillText('Password: ' + SCHOOL.pass, 256, 178); c.font = `500 22px ${FONT}`; c.fillStyle = '#495057'; c.fillText('2.4 GHz · 192.168.1.1', 256, 222);
  const stick = new THREE.MeshStandardMaterial({ map: (() => { const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })(), roughness: 0.6 });
  g.add(box(128, 26, 86, [white, white, white, white, white, white], 0, 13, 0));
  const top = new THREE.Mesh(new THREE.PlaneGeometry(100, 50), stick); top.rotation.x = -Math.PI / 2; top.position.set(0, 26.05, 6); g.add(top);
  for (const s of [-1, 1]) { const a = cyl(3.2, 110, new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.5 }), s * 52, 26 + 55, -38, 14, 2.6); g.add(a); g.add(cyl(5, 6, white, s * 52, 26 + 2, -38, 14)); }
  const leds = []; for (let i = 0; i < 4; i++) { const m = new THREE.MeshStandardMaterial({ color: 0xeaf7ee, emissive: 0x33ff66, emissiveIntensity: 1.6 }); const l = box(4, 2, 0.6, m, -30 + i * 20, 15, 43.2); g.add(l); leds.push(m); }
  g.userData.leds = leds; g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  void tx; return g;
}
