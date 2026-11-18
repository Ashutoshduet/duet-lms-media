// Draws the printable DUET Pad (A4 / A3) and the DUET Cube net as one vector SVG, sized in millimetres.
// make_print.mjs opens print.html?sheet=pad-a4|pad-a3|cube in headless Chrome and saves the PDF.
// All marker ids, sizes and places come from ar/js/markers.js.
import { PAD, CUBE, CARD, CARD_ID0, markerBits, cardBits, DICTIONARY } from '/ar/js/markers.js';

const C = { ink: '#1E2530', slate: '#3A4454', mute: '#6B7482', faint: '#C6CBD3', panel: '#F2F3F5', line: '#DADEE4', orange: '#F26B1D', tab: '#ECEEF1' };
const q = new URLSearchParams(location.search);
const sheet = q.get('sheet') || 'pad-a4';
const f = (n) => +n.toFixed(3);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** an ArUco marker: black square of `size` mm centred at (x, y), its 4×4 cells, upright on the sheet */
function marker(id, x, y, size) {
  const cell = size / 6, x0 = x - size / 2, y0 = y - size / 2, b = markerBits(id);
  let s = `<g shape-rendering="crispEdges"><rect x="${f(x0)}" y="${f(y0)}" width="${f(size)}" height="${f(size)}" fill="#000"/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (b[r][c]) s += `<rect x="${f(x0 + (c + 1) * cell)}" y="${f(y0 + (r + 1) * cell)}" width="${f(cell + 0.004)}" height="${f(cell + 0.004)}" fill="#fff"/>`;
  return s + '</g>';
}

/** corner brackets a little outside a marker's white margin: looks like a precision target, and leaves the margin clear */
function brackets(x, y, size, gap, len, col, inner = Math.sign(-x + 148.5)) {
  const h = size / 2 + gap, v = size / 2 + 3.5; let s = '';   // beside the marker's inner side, inside the printable area
  for (const [sx, sy] of [[inner, -1], [inner, 1]]) {
    const cx = x + sx * h, cy = y + sy * v;
    s += `<path d="M${f(cx - sx * len)} ${f(cy)} L${f(cx)} ${f(cy)} L${f(cx)} ${f(cy - sy * len)}" fill="none" stroke="${col}" stroke-width="0.35" stroke-linecap="round"/>`;
  }
  return s;
}

/** the DUET emblem: an orange ring round a small 3D cube; then the word mark */
function logo(x, y, s, sub) {
  const r = 4.6 * s;
  const cube = (cx, cy, k) => {
    const a = k * 0.866, b = k * 0.5;
    return `<path d="M${f(cx)} ${f(cy - k)} L${f(cx + a)} ${f(cy - b)} L${f(cx + a)} ${f(cy + b)} L${f(cx)} ${f(cy + k)} L${f(cx - a)} ${f(cy + b)} L${f(cx - a)} ${f(cy - b)} Z M${f(cx - a)} ${f(cy - b)} L${f(cx)} ${f(cy)} L${f(cx + a)} ${f(cy - b)} M${f(cx)} ${f(cy)} L${f(cx)} ${f(cy + k)}" fill="none" stroke="${C.ink}" stroke-width="${f(0.55 * s)}" stroke-linejoin="round"/>`;
  };
  return `<g><circle cx="${f(x + r)}" cy="${f(y)}" r="${f(r)}" fill="none" stroke="${C.orange}" stroke-width="${f(1.25 * s)}"/>${cube(x + r, y, 2.35 * s)}
    <text x="${f(x + 2 * r + 2.6 * s)}" y="${f(y + 3.45 * s)}" font-size="${f(10 * s)}" font-weight="700" letter-spacing="${f(0.9 * s)}" fill="${C.ink}">DUET</text>
    <text x="${f(x + 2 * r + 36 * s)}" y="${f(y + 3.45 * s)}" font-size="${f(10 * s)}" font-weight="300" letter-spacing="${f(0.5 * s)}" fill="${C.orange}">${esc(sub)}</text></g>`;
}

function scaleBar(x, y, mm, k) {
  let s = `<g><rect x="${f(x)}" y="${f(y)}" width="${f(mm)}" height="${f(1.6)}" fill="${C.ink}"/>`;
  for (let i = 0; i <= mm; i += 5) s += `<line x1="${f(x + i)}" y1="${f(y - (i % 10 ? 1 : 1.8))}" x2="${f(x + i)}" y2="${f(y)}" stroke="${C.ink}" stroke-width="0.2"/>`;
  s += `<text x="${f(x + mm + 2)}" y="${f(y + 1.5)}" font-size="2.6" font-weight="600" fill="${C.ink}">${mm} mm</text>`;
  s += `<text x="${f(x)}" y="${f(y + 5.4)}" font-size="2.15" fill="${C.mute}">${esc(k)}</text></g>`;
  return s;
}

// ------------------------------------------------------------------------------------------------ the pad
function pad(paper) {
  const W = PAD.paper.a4.w, H = PAD.paper.a4.h, cx = W / 2, cy = H / 2, M = PAD.marker, R = PAD.stage.r;
  const px0 = 70, px1 = W - 70, py0 = 8, py1 = H - 8;          // the grey bench panel between the two marker rails
  let s = `<rect width="${W}" height="${H}" fill="#fff"/>`;
  s += `<rect x="${px0}" y="${py0}" width="${px1 - px0}" height="${py1 - py0}" rx="7" fill="${C.panel}" stroke="${C.line}" stroke-width="0.3"/>`;
  // dot grid (dots are never squares, so the marker finder ignores them)
  for (let gx = cx - 70; gx <= cx + 70 + 0.01; gx += 10) for (let gy = cy - 90; gy <= cy + 90 + 0.01; gy += 10) {
    if (Math.hypot(gx - cx, gy - cy) < R + 7 || gx < px0 + 4 || gx > px1 - 4) continue;
    s += `<circle cx="${f(gx)}" cy="${f(gy)}" r="0.42" fill="${C.faint}"/>`;
  }
  // header and footer plates (cover the dots behind the words)
  s += `<rect x="${px0 + 6}" y="${py0 + 5}" width="${px1 - px0 - 12}" height="24" rx="4" fill="${C.panel}"/>`;
  s += `<rect x="${px0 + 6}" y="${py1 - 33}" width="${px1 - px0 - 12}" height="28" rx="4" fill="${C.panel}"/>`;
  // the stage
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff" stroke="${C.ink}" stroke-width="0.55"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R - 18}" fill="none" stroke="${C.faint}" stroke-width="0.3" stroke-dasharray="1.2 1.4"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R - 30}" fill="none" stroke="${C.line}" stroke-width="0.25"/>`;
  for (let a = 0; a < 360; a += 5) {
    const big = a % 90 === 0, mid = a % 15 === 0, r0 = R - (big ? 8 : mid ? 4.2 : 2.4), rad = (a - 90) * Math.PI / 180;
    s += `<line x1="${f(cx + Math.cos(rad) * r0)}" y1="${f(cy + Math.sin(rad) * r0)}" x2="${f(cx + Math.cos(rad) * (R - 0.4))}" y2="${f(cy + Math.sin(rad) * (R - 0.4))}" stroke="${big ? C.orange : C.slate}" stroke-width="${big ? 0.8 : mid ? 0.32 : 0.2}" stroke-linecap="round"/>`;
    if (a % 45 === 0) { const rt = R - 12.5; s += `<text x="${f(cx + Math.cos(rad) * rt)}" y="${f(cy + Math.sin(rad) * rt + 1)}" font-size="2.7" font-weight="500" text-anchor="middle" fill="${C.mute}">${a}°</text>`; }
  }
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) s += `<line x1="${f(cx + dx * 6)}" y1="${f(cy + dy * 6)}" x2="${f(cx + dx * (R - 32))}" y2="${f(cy + dy * (R - 32))}" stroke="${C.faint}" stroke-width="0.22"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="2.6" fill="none" stroke="${C.orange}" stroke-width="0.6"/><circle cx="${cx}" cy="${cy}" r="0.6" fill="${C.orange}"/>`;
  // words round the top of the stage
  const ar = R + 4.2;
  s += `<path id="arc" d="M${f(cx - ar)} ${cy} A${ar} ${ar} 0 0 1 ${f(cx + ar)} ${cy}" fill="none"/>`;
  s += `<text font-size="2.5" font-weight="600" letter-spacing="0.9" fill="${C.mute}"><textPath href="#arc" startOffset="50%" text-anchor="middle">DUET AR STAGE  ·  THE MODEL STANDS HERE</textPath></text>`;
  s += `<path id="arc2" d="M${f(cx - ar - 2.6)} ${cy} A${ar + 2.6} ${ar + 2.6} 0 0 0 ${f(cx + ar + 2.6)} ${cy}" fill="none"/>`;
  s += `<text class="hi" font-size="2.9" font-weight="600" fill="${C.mute}"><textPath href="#arc2" startOffset="50%" text-anchor="middle">मॉडल यहाँ खड़ा होगा</textPath></text>`;
  // header
  s += logo(cx - 50, py0 + 15.5, 0.92, 'AR PAD');
  s += `<text x="${cx}" y="${py0 + 26}" font-size="2.6" text-anchor="middle" fill="${C.mute}" letter-spacing="0.25">DUET STEM 360  ·  ${paper === 'a3' ? 'A3' : 'A4'}  ·  Augmented-reality bench mat</text>`;
  // footer: how to use, in Hindi and English, and the size check
  s += `<text class="hi" x="${cx}" y="${py1 - 24}" font-size="3.5" font-weight="600" text-anchor="middle" fill="${C.ink}">पैड को मेज़ पर सीधा बिछाएँ, DUET AR में "Pad" चुनें और फ़ोन का कैमरा इस पर रखें।</text>`;
  s += `<text x="${cx}" y="${py1 - 18}" font-size="3.0" text-anchor="middle" fill="${C.slate}">Lay the pad flat, choose “Pad” in DUET AR and point the phone at it. A DUET AR card laid on the stage brings its own model.</text>`;
  s += scaleBar(px0 + 14, py1 - 11, 50, 'Must measure 50 mm: print at 100% / 100% पर छापें');
  s += `<text x="${px1 - 14}" y="${py1 - 9.4}" font-size="2.1" text-anchor="end" fill="${C.mute}">ArUco 4×4 · ids ${PAD.markers.map((m) => m.id).join(' ')} · ${PAD.marker} mm at A4</text>`;
  s += `<text x="${px1 - 14}" y="${py1 - 5.8}" font-size="2.1" text-anchor="end" fill="${C.mute}">© DUET STEM · free to print for teaching</text>`;
  // the markers on the two rails, each with its precision brackets and a tiny label
  for (const m of PAD.markers) {
    const x = cx + m.x, y = cy + m.z;
    s += marker(m.id, x, y, M);
    s += brackets(x, y, M, 9.5, 3.2, C.faint);
  }
  // little rail captions between the markers
  for (const side of [-1, 1]) for (const zz of [-36.5, 36.5]) {
    const x = cx + side * 116.5, y = cy + zz;
    s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${side * 90})"><text x="0" y="1" font-size="2.3" font-weight="600" letter-spacing="1.2" text-anchor="middle" fill="${C.faint}">DUET · AR</text></g>`;
  }
  // A3 is the same picture made √2 bigger (420 × 297 mm; the 0.02 mm A-series rounding goes to the margins)
  return paper === 'a3' ? { w: 420, h: 297, vw: W, vh: H, body: s } : { w: W, h: H, vw: W, vh: H, body: s };
}

// ------------------------------------------------------------------------------------------------ the cube net
function cube() {
  const W = 210, H = 297, E = CUBE.edge, M = CUBE.marker, T = 9;   // T: glue flap depth
  const x0 = (W - 3 * E) / 2, y0 = 36;
  const at = (col, row) => [x0 + col * E, y0 + row * E];
  const faces = Object.fromEntries(CUBE.faces.map((fc) => [fc.face, { ...fc, xy: at(fc.net[0], fc.net[1]) }]));
  let s = `<rect width="${W}" height="${H}" fill="#fff"/>`;
  // which face edges touch another face (fold) / a flap (fold) / nothing (cut)
  const key = (a, b) => [a, b].map((p) => p.map(f).join(',')).sort().join('|');
  const faceEdges = (xy) => { const [x, y] = xy; return { top: [[x, y], [x + E, y]], right: [[x + E, y], [x + E, y + E]], bottom: [[x, y + E], [x + E, y + E]], left: [[x, y], [x, y + E]] }; };
  const count = {};
  for (const fc of Object.values(faces)) for (const e of Object.values(faceEdges(fc.xy))) count[key(...e)] = (count[key(...e)] || 0) + 1;
  const tabSet = new Set(CUBE.tabs.map(([fc, side]) => key(...faceEdges(faces[fc].xy)[side])));
  let cuts = '', folds = '', flaps = '';
  // glue flaps: trapezoids out from the face edge
  for (const [fc, side] of CUBE.tabs) {
    const [a, b] = faceEdges(faces[fc].xy)[side];
    const out = { top: [0, -1], bottom: [0, 1], left: [-1, 0], right: [1, 0] }[side];
    const along = [(b[0] - a[0]) / E, (b[1] - a[1]) / E], ch = T * 0.9;
    const p = [a, [a[0] + out[0] * T + along[0] * ch, a[1] + out[1] * T + along[1] * ch], [b[0] + out[0] * T - along[0] * ch, b[1] + out[1] * T - along[1] * ch], b];
    flaps += `<path d="M${p.map((v) => v.map(f).join(' ')).join(' L')} Z" fill="${C.tab}"/>`;
    cuts += `<path d="M${p.map((v) => v.map(f).join(' ')).join(' L')}" fill="none"/>`;
    const mx = (p[1][0] + p[2][0]) / 2 - out[0] * T * 0.45, my = (p[1][1] + p[2][1]) / 2 - out[1] * T * 0.45, rot = side === 'left' ? -90 : side === 'right' ? 90 : 0;
    flaps += `<g transform="translate(${f(mx)} ${f(my)}) rotate(${rot})"><text x="0" y="1" font-size="2.3" font-weight="600" letter-spacing="0.4" text-anchor="middle" fill="${C.mute}">GLUE · <tspan class="hi">गोंद</tspan></text></g>`;
  }
  for (const fc of Object.values(faces)) for (const e of Object.values(faceEdges(fc.xy))) {
    const k = key(...e), d = `M${e[0].map(f).join(' ')} L${e[1].map(f).join(' ')} `;
    if (count[k] > 1 || tabSet.has(k)) { if (!folds.includes(d)) folds += d; } else cuts += `<path d="${d}" fill="none"/>`;
  }
  s += flaps;
  // faces: white, the marker in the middle, a small DUET mark in one corner
  for (const fc of Object.values(faces)) {
    const [x, y] = fc.xy;
    s += `<rect x="${f(x)}" y="${f(y)}" width="${E}" height="${E}" fill="#fff"/>`;
    s += marker(fc.id, x + E / 2, y + E / 2, M);
    s += `<text x="${f(x + 2.4)}" y="${f(y + E - 2.2)}" font-size="1.9" font-weight="700" letter-spacing="0.5" fill="${C.faint}">DUET</text>`;
    s += `<circle cx="${f(x + E - 3.2)}" cy="${f(y + E - 2.9)}" r="0.9" fill="none" stroke="${C.orange}" stroke-width="0.4"/>`;
  }
  s += `<path d="${folds}" fill="none" stroke="${C.mute}" stroke-width="0.3" stroke-dasharray="1.6 1.2"/>`;
  s += `<g stroke="${C.ink}" stroke-width="0.4" stroke-linejoin="round">${cuts}</g>`;
  // scissors where to start cutting
  const [sx, sy] = faces.top.xy;
  s += `<text x="${f(sx + E + 2)}" y="${f(sy + 4)}" font-size="5" fill="${C.ink}">✂</text>`;
  // header
  s += logo(x0, 17, 0.95, 'AR CUBE');
  s += `<text x="${x0}" y="28.5" font-size="2.7" fill="${C.mute}">Print at 100% on thick paper or card (200–300 gsm). One sheet = one cube of ${E / 10} cm.</text>`;
  s += `<text class="hi" x="${x0}" y="32.6" font-size="2.9" fill="${C.mute}">मोटे कागज़ या कार्ड पर 100% साइज़ में छापें। एक पन्ने से ${E / 10} सेमी का एक घन बनेगा।</text>`;
  // how to make it: 4 steps in the free corners beside the net
  const steps = [
    ['Cut along the solid lines.', 'ठोस रेखाओं पर काटें।', 'cut'],
    ['Fold every dashed line, print outside.', 'हर डैश वाली रेखा मोड़ें, छपाई बाहर रहे।', 'fold'],
    ['Glue the grey flaps inside and close the cube.', 'धूसर पट्टियों पर गोंद लगाकर घन बंद करें।', 'glue'],
    ['Open DUET AR → Cube and hold it by the corners.', 'DUET AR में "Cube" चुनें, घन को कोनों से पकड़ें।', 'hold'],
  ];
  // the free corners beside the net: above the left/right faces' flaps, and beside the bottom and back faces
  const boxes = [[x0 - 1, y0 + 2, E - 4], [x0 + 2 * E + 5, y0 + 2, E - 6], [x0 - 1, y0 + 2 * E + 14, E - 12], [x0 + 2 * E + 12, y0 + 2 * E + 14, E - 13]];
  steps.forEach(([en, hi, icon], i) => {
    const [bx, by, wdt] = boxes[i];
    s += `<g><circle cx="${f(bx + 4)}" cy="${f(by + 4)}" r="4" fill="${C.orange}"/><text x="${f(bx + 4)}" y="${f(by + 5.4)}" font-size="4" font-weight="700" text-anchor="middle" fill="#fff">${i + 1}</text>`;
    s += stepIcon(icon, bx + 28, by + 9);
    s += wrap(en, bx, by + 24, wdt, 2.7, C.ink, '') + wrap(hi, bx, by + 24 + 3.4 * lines(en, wdt, 2.7) + 1.2, wdt, 2.85, C.slate, 'hi') + '</g>';
  });
  s += `<g transform="translate(${f(x0)} ${H - 18})">
    <line x1="0" y1="0" x2="10" y2="0" stroke="${C.ink}" stroke-width="0.4"/><text x="12" y="0.9" font-size="2.5" fill="${C.ink}">cut / <tspan class="hi">काटें</tspan></text>
    <line x1="34" y1="0" x2="44" y2="0" stroke="${C.mute}" stroke-width="0.3" stroke-dasharray="1.6 1.2"/><text x="46" y="0.9" font-size="2.5" fill="${C.ink}">fold / <tspan class="hi">मोड़ें</tspan></text>
    <rect x="70" y="-1.8" width="10" height="3.6" fill="${C.tab}"/><text x="82" y="0.9" font-size="2.5" fill="${C.ink}">glue / <tspan class="hi">गोंद</tspan></text></g>`;
  s += scaleBar(x0 + 3 * E - 62, H - 18.8, 50, 'Must measure 50 mm / 100% पर छापें');
  s += `<text x="${x0}" y="${H - 8}" font-size="2.1" fill="${C.mute}">ArUco 4×4 · ids ${CUBE.faces.map((fc) => fc.id).join(' ')} · ${M} mm markers on ${E} mm faces · © DUET STEM · free to print for teaching</text>`;
  return { w: W, h: H, vw: W, vh: H, body: s };
}

const lines = (t, w, fs) => Math.ceil((t.length * fs * 0.52) / w);
function wrap(text, x, y, w, fs, col, cls) {
  const words = text.split(' '), out = []; let cur = '';
  for (const wd of words) { const nx = cur ? cur + ' ' + wd : wd; if (nx.length * fs * 0.52 > w && cur) { out.push(cur); cur = wd; } else cur = nx; }
  if (cur) out.push(cur);
  return out.map((ln, i) => `<text ${cls ? `class="${cls}"` : ''} x="${f(x)}" y="${f(y + i * fs * 1.25)}" font-size="${fs}" fill="${col}">${esc(ln)}</text>`).join('');
}

/** small line drawings for the 4 steps (our own) */
function stepIcon(kind, x, y) {
  const st = `fill="none" stroke="${C.slate}" stroke-width="0.45" stroke-linecap="round" stroke-linejoin="round"`;
  if (kind === 'cut') return `<g ${st}><rect x="${x - 11}" y="${y - 6}" width="13" height="13" stroke-dasharray="0"/><path d="M${x + 2} ${y - 6} L${x + 9} ${y - 6}" stroke-dasharray="1 1"/><circle cx="${x + 11}" cy="${y - 8}" r="1.6"/><circle cx="${x + 11}" cy="${y - 3.8}" r="1.6"/><path d="M${x + 9.6} ${y - 7.2} L${x + 4} ${y - 5.6} M${x + 9.6} ${y - 4.6} L${x + 4} ${y - 6.4}"/></g>`;
  if (kind === 'fold') return `<g ${st}><path d="M${x - 11} ${y + 6} L${x - 1} ${y + 6} L${x - 1} ${y - 6} L${x - 11} ${y - 6} Z"/><path d="M${x - 1} ${y + 6} L${x + 8} ${y + 2} L${x + 8} ${y - 9} L${x - 1} ${y - 6}"/><path d="M${x - 1} ${y - 6} L${x - 1} ${y + 6}" stroke="${C.orange}" stroke-dasharray="1.2 0.9"/><path d="M${x + 11} ${y - 4} q-1 -4 -4 -5" /><path d="M${x + 7} ${y - 9.6} l0.2 1.4 l1.2 -0.5"/></g>`;
  if (kind === 'glue') return `<g ${st}><path d="M${x - 10} ${y - 2} L${x} ${y - 7} L${x + 10} ${y - 2} L${x} ${y + 3} Z"/><path d="M${x - 10} ${y - 2} L${x - 10} ${y + 7} L${x} ${y + 12} L${x + 10} ${y + 7} L${x + 10} ${y - 2} M${x} ${y + 3} L${x} ${y + 12}"/><path d="M${x + 4} ${y - 4.5} L${x + 7} ${y - 3}" stroke="${C.orange}" stroke-width="1.2"/></g>`;
  return `<g ${st}><rect x="${x - 15}" y="${y - 9}" width="12" height="20" rx="2"/><path d="M${x - 11} ${y + 8} L${x - 7} ${y + 8}"/><path d="M${x + 2} ${y - 3} L${x + 8} ${y - 6} L${x + 14} ${y - 3} L${x + 8} ${y} Z M${x + 2} ${y - 3} L${x + 2} ${y + 4} L${x + 8} ${y + 7} L${x + 14} ${y + 4} L${x + 14} ${y - 3} M${x + 8} ${y} L${x + 8} ${y + 7}"/><path d="M${x - 3} ${y} L${x + 1} ${y}" stroke="${C.orange}" stroke-dasharray="1 0.8"/></g>`;
}

// ------------------------------------------------------------------------------------------------ the DUET AR Cards
// window.CARDS (set by make_cards.mjs before the page loads): {items: [catalog items with card numbers], groups, pics: {id: data URI},
// qr: {id: [[0/1 …] …], scan: …}, set: 'body' | … | 'all', url}. Four 97 × 140.5 mm cards on an A4 page, touching (one cut
// between two cards), inside an 8 mm margin; a cover page first. Everything about the marker and the dots comes from markers.js.
const CD = window.CARDS || { items: [], groups: [], pics: {}, qr: {} };
const L3 = (o, l) => (o ? o[l] || o.en : '');
function cardMarker(id, x, y, size) {   // a card marker: 5×5 cells inside the black border (7×7 in all)
  const cell = size / 7, x0 = x - size / 2, y0 = y - size / 2, b = cardBits(id);
  let s = `<g shape-rendering="crispEdges"><rect x="${f(x0)}" y="${f(y0)}" width="${f(size)}" height="${f(size)}" fill="#000"/>`;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (b[r][c]) s += `<rect x="${f(x0 + (c + 1) * cell)}" y="${f(y0 + (r + 1) * cell)}" width="${f(cell + 0.004)}" height="${f(cell + 0.004)}" fill="#fff"/>`;
  return s + '</g>';
}
function qr(m, x, y, size) {   // a QR code from its module matrix (the matrix already has a 2-module white border)
  if (!m) return '';
  const n = m.length, k = size / n; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) d += `M${f(x + c * k)} ${f(y + r * k)}h${f(k + 0.01)}v${f(k + 0.01)}h${f(-k - 0.01)}z`;
  return `<rect x="${f(x)}" y="${f(y)}" width="${f(size)}" height="${f(size)}" fill="#fff"/><path d="${d}" fill="#111" shape-rendering="crispEdges"/>`;
}
/** text that fits a width: the size shrinks for a long line (Latin ≈ 0.53 em per letter, Devanagari ≈ 0.6) */
function fitText(t, x, y, w, size, attrs, hi) {
  const k = hi ? 0.6 : 0.53, fs = Math.min(size, w / Math.max(1, t.length * k));
  return `<text x="${f(x)}" y="${f(y)}" font-size="${f(fs)}" ${hi ? 'class="hi" ' : ''}${attrs}>${esc(t)}</text>`;
}
function wrapLines(t, w, fs, k = 0.5) {
  const out = []; let cur = '';
  for (const wd of t.split(' ')) { const nx = cur ? cur + ' ' + wd : wd; if (nx.length * fs * k > w && cur) { out.push(cur); cur = wd; } else cur = nx; }
  if (cur) out.push(cur); return out;
}
function headset(x, y, s, col) {   // a small VR headset glyph (our own drawing)
  return `<g fill="none" stroke="${col}" stroke-width="${f(0.32 * s)}" stroke-linejoin="round"><path d="M${f(x)} ${f(y + 1 * s)} h${f(6 * s)} v${f(2.6 * s)} a${f(0.6 * s)} ${f(0.6 * s)} 0 0 1 ${f(-0.6 * s)} ${f(0.6 * s)} h${f(-1.3 * s)} l${f(-0.6 * s)} ${f(-0.8 * s)} h${f(-0.6 * s)} l${f(-0.6 * s)} ${f(0.8 * s)} h${f(-1.3 * s)} a${f(0.6 * s)} ${f(0.6 * s)} 0 0 1 ${f(-0.6 * s)} ${f(-0.6 * s)} z"/></g>`;
}
// widths measured with the real fonts (a hidden SVG text), so wrapped lines never run into anything
const SVGNS = 'http://www.w3.org/2000/svg';
let MT = null;
function textWidth(t, size, hi, weight = 400) {
  if (!MT) { const sv = document.createElementNS(SVGNS, 'svg'); sv.setAttribute('width', '0'); sv.setAttribute('height', '0'); sv.style.position = 'absolute'; MT = document.createElementNS(SVGNS, 'text'); sv.appendChild(MT); document.body.appendChild(sv); }
  MT.setAttribute('font-size', size); MT.setAttribute('font-weight', weight); MT.setAttribute('class', hi ? 'hi' : ''); MT.textContent = t;
  return MT.getComputedTextLength();
}
/** words into lines; maxW(k) is the width allowed for line k */
function wrapMeasured(t, size, hi, maxW, weight) {
  const out = []; let cur = '';
  for (const wd of t.split(' ')) { const nx = cur ? cur + ' ' + wd : wd; if (cur && textWidth(nx, size, hi, weight) > maxW(out.length)) { out.push(cur); cur = wd; } else cur = nx; }
  if (cur) out.push(cur); return out;
}
/** one line that must fit a width: never smaller than 7 pt (2.47 mm); a longer text gets a narrower letter spacing instead */
function fitMeasured(t, x, y, w, size, attrs, hi, weight) {
  const wd = textWidth(t, size, hi, weight); let extra = '';
  if (wd > w) extra = ` textLength="${f(w)}" lengthAdjust="spacingAndGlyphs"`;
  return `<text x="${f(x)}" y="${f(y)}" font-size="${size}" ${hi ? 'class="hi" ' : ''}${attrs}${extra}>${esc(t)}</text>`;
}
function oneCard(it, ox, oy) {
  const W = CARD.w, H = CARD.h, g = CD.groups.find((x) => x.id === it.group) || { color: C.orange, name: { en: '' } }, col = g.color;
  const id = CARD_ID0 + it.card;
  let s = `<g transform="translate(${f(ox)} ${f(oy)})"><rect width="${W}" height="${H}" fill="#fff"/>`;
  // header band between the two top dots
  s += `<rect x="16.5" y="5" width="${W - 33}" height="8" rx="2" fill="${col}"/>`;
  s += `<text x="19.5" y="10.4" font-size="3.3" font-weight="700" letter-spacing="0.5" fill="#fff">DUET AR</text>`;
  s += fitText(`${L3(g.name, 'en')} · ${L3(g.name, 'hi')}`, W - 19.5, 10.3, 37, 2.9, 'font-weight="600" fill="#fff" text-anchor="end"', true);
  // the picture
  s += `<rect x="4" y="15" width="${W - 8}" height="46" rx="3" fill="#f4f2ee"/>`;
  const pic = CD.pics[it.id]; if (pic) s += `<image href="${pic}" x="5" y="15.5" width="${W - 10}" height="45" preserveAspectRatio="xMidYMid meet"/>`;
  s += `<rect x="6.2" y="17.2" width="9.4" height="5" rx="2.5" fill="${col}"/><text x="10.9" y="20.75" font-size="3.1" font-weight="700" text-anchor="middle" fill="#fff">${it.card + 1}</text>`;
  // the names
  s += fitText(L3(it.name, 'en'), 5, 67.5, W - 10, 5.4, `font-weight="700" fill="${C.ink}"`);
  s += fitText(L3(it.name, 'hi'), 5, 74.6, W - 10, 4.7, `font-weight="600" fill="${C.slate}"`, true);
  // the marker (the model stands on the card) and the three corner dots
  s += cardMarker(id, CARD.marker.x, CARD.marker.y, CARD.marker.size);
  for (const d of CARD.dots) s += `<rect x="${f(d.x - CARD.dot / 2)}" y="${f(d.y - CARD.dot / 2)}" width="${CARD.dot}" height="${CARD.dot}" fill="#000" shape-rendering="crispEdges"/>`;
  // right column: the QR code (opens DUET AR on this card), then how to see it on a Quest. All text here is 2.5 mm
  // (7 pt) or more, wrapped with the real font's widths; below the bottom-right dot's top the lines stop short of it.
  const cx = 63.5, cw = W - 3.5 - cx, FS = 2.5, LH = 2.95, QS = 18.5;
  s += qr(CD.qr[it.id], cx + (cw - QS) / 2, 81.5, QS);
  s += fitMeasured('Scan: phone camera', cx + cw / 2, 103.4, cw, FS, `font-weight="600" text-anchor="middle" fill="${C.ink}"`);
  s += fitMeasured('फ़ोन कैमरे से स्कैन करें', cx + cw / 2, 106.6, cw, FS, `text-anchor="middle" fill="${C.slate}"`, true);
  s += `<line x1="${f(cx)}" y1="108.4" x2="${f(cx + cw)}" y2="108.4" stroke="${C.line}" stroke-width="0.25"/>`;
  s += headset(cx, 109.7, 0.62, col);                                   // 3.7 mm wide: the heading starts 1.2 mm after it
  s += `<text x="${f(cx + 4.9)}" y="112.4" font-size="${FS}" font-weight="700" fill="${col}">On Meta Quest:</text>`;
  const dotTop = CARD.dots[2].y - CARD.dot / 2 - 1.2, narrow = CARD.dots[2].x - CARD.dot / 2 - 3 - cx;   // keep 3 mm clear of the dot
  const widthAt = (y) => (y + 0.6 > dotTop ? narrow : cw);   // any line that reaches the dot's height stops short of it
  let yy = 115.7;
  const put = (text, hi, fill) => {
    for (const ln of wrapMeasured(text, FS, hi, (k) => widthAt(yy + k * LH))) {
      if (yy > H - 3.5) { console.error('card text does not fit: ' + it.id); break; }
      s += `<text ${hi ? 'class="hi" ' : ''}x="${f(cx)}" y="${f(yy)}" font-size="${FS}" fill="${fill}">${esc(ln)}</text>`; yy += LH;
    }
  };
  put(`Open DUET AR, choose “${L3(it.name, 'en')}”.`, false, C.slate);
  put(`DUET AR खोलें, “${L3(it.name, 'hi')}” चुनें।`, true, C.mute);
  return s + '</g>';
}
function cardSheet(items, label) {
  const { w: PW, h: PH, margin: M } = CARD.sheet, W = CARD.w, H = CARD.h;
  let s = `<rect width="${PW}" height="${PH}" fill="#fff"/>`;
  items.forEach((it, i) => { s += oneCard(it, M + (i % 2) * W, M + Math.floor(i / 2) * H); });
  // cut lines: dashed between and round the cards, crop marks in the margin
  const x0 = M, x1 = M + 2 * W, y0 = M, y1 = M + 2 * H, xm = M + W, ym = M + H;
  s += `<g stroke="${C.mute}" stroke-width="0.25" stroke-dasharray="2 1.4" fill="none"><rect x="${x0}" y="${y0}" width="${2 * W}" height="${2 * H}"/><path d="M${xm} ${y0} V${y1} M${x0} ${ym} H${x1}"/></g>`;
  s += `<g stroke="${C.ink}" stroke-width="0.3">`;
  for (const x of [x0, xm, x1]) s += `<path d="M${x} 1.5 V${y0 - 1.5} M${x} ${y1 + 1.5} V${PH - 1.5}"/>`;
  for (const y of [y0, ym, y1]) s += `<path d="M1.5 ${y} H${x0 - 1.5} M${x1 + 1.5} ${y} H${PW - 1.5}"/>`;
  s += '</g>';
  s += `<text x="${PW / 2}" y="5.6" font-size="2.3" text-anchor="middle" fill="${C.mute}">✂ ${esc(label)} · cut along the dashed lines / बिंदुदार रेखाओं पर काटें · print at 100%</text>`;
  return s;
}
function cover(set, items) {
  const PW = 210, PH = 297, g = CD.groups.find((x) => x.id === set), col = g ? g.color : C.orange, X = 18;
  let s = `<rect width="${PW}" height="${PH}" fill="#fff"/><rect width="${PW}" height="6" fill="${col}"/>`;
  s += logo(X, 22, 1.25, 'AR CARDS');
  s += `<text x="${X}" y="40" font-size="9" font-weight="700" fill="${C.ink}">${esc(g ? L3(g.name, 'en') : 'All subjects')}</text>`;
  s += `<text class="hi" x="${X}" y="49" font-size="7" font-weight="600" fill="${C.slate}">${esc(g ? L3(g.name, 'hi') : 'सभी विषय')} · ${items.length} cards / कार्ड</text>`;
  // six pictures of the set
  const pick6 = items.filter((it, i) => i % Math.max(1, Math.floor(items.length / 6)) === 0).slice(0, 6);
  pick6.forEach((it, i) => {
    const x = X + (i % 3) * 59, y = 56 + Math.floor(i / 3) * 40, gg = CD.groups.find((q) => q.id === it.group);
    s += `<rect x="${x}" y="${y}" width="56" height="37" rx="3" fill="#f4f2ee"/>`;
    if (CD.pics[it.id]) s += `<image href="${CD.pics[it.id]}" x="${x + 1}" y="${y + 1}" width="54" height="30" preserveAspectRatio="xMidYMid meet"/>`;
    s += `<text x="${x + 3}" y="${y + 34.5}" font-size="2.6" font-weight="600" fill="${gg ? gg.color : C.ink}">${it.card + 1} · ${esc(L3(it.name, 'en'))}</text>`;
  });
  // how to use, in English and Hindi
  const steps = [
    ['Print at 100% (actual size). The bar below must measure 50 mm.', '100% (असली साइज़) पर छापें। नीचे की पट्टी 50 मिमी होनी चाहिए।'],
    ['Cut the cards along the dashed lines.', 'कार्डों को बिंदुदार रेखाओं पर काटें।'],
    ['Open DUET AR on your phone (scan the big QR code) and tap “Scan a card”.', 'फ़ोन पर DUET AR खोलें (बड़ा QR कोड स्कैन करें) और “कार्ड स्कैन करें” दबाएँ।'],
    ['Point the camera at a card, 20–60 cm away: its 3D model stands up on the card.', 'कैमरे को 20–60 सेमी दूर से कार्ड की ओर करें: उसका 3D मॉडल कार्ड पर खड़ा हो जाएगा।'],
    ['Tap a part to hear its name. Take it apart, or open it in 360° or a VR box.', 'किसी हिस्से को छुएँ और उसका नाम सुनें। उसे अलग करें, या 360° या VR बॉक्स में खोलें।'],
  ];
  let y = 147; s += `<text x="${X}" y="${y - 6}" font-size="4.4" font-weight="700" fill="${C.ink}">How to use · <tspan class="hi">कैसे चलाएँ</tspan></text>`;
  steps.forEach(([en, hi], i) => {
    s += `<circle cx="${X + 3}" cy="${y + 0.2}" r="3" fill="${col}"/><text x="${X + 3}" y="${y + 1.3}" font-size="3.2" font-weight="700" text-anchor="middle" fill="#fff">${i + 1}</text>`;
    s += `<text x="${X + 9}" y="${y + 1}" font-size="3.4" fill="${C.ink}">${esc(en)}</text><text class="hi" x="${X + 9}" y="${y + 6}" font-size="3.4" fill="${C.slate}">${esc(hi)}</text>`;
    y += 12.5;
  });
  // tips, Quest, the QR code to the scanner, the size check
  s += `<rect x="${X}" y="${y + 1}" width="${PW - 2 * X}" height="25" rx="3" fill="#f4f2ee"/>`;
  s += headset(X + 4, y + 5, 1.1, col) + `<text x="${X + 13}" y="${y + 8.6}" font-size="3.3" font-weight="700" fill="${C.ink}">On Meta Quest · <tspan class="hi">Meta Quest पर</tspan></text>`;
  s += `<text x="${X + 4}" y="${y + 15}" font-size="3" fill="${C.slate}">The Quest browser gives web pages no camera: open DUET AR and choose the card’s name.</text>`;
  s += `<text x="${X + 4}" y="${y + 19.6}" font-size="3" fill="${C.slate}">The model stands on your real table in mixed reality.</text>`;
  s += `<text class="hi" x="${X + 4}" y="${y + 24}" font-size="3.1" fill="${C.mute}">DUET AR खोलें और कार्ड का नाम चुनें: मॉडल आपकी असली मेज़ पर दिखेगा।</text>`;
  y += 31;
  s += qr(CD.qr.scan, X, y, 30) + `<text x="${X + 34}" y="${y + 7}" font-size="3.6" font-weight="700" fill="${C.ink}">DUET AR</text><text x="${X + 34}" y="${y + 12}" font-size="2.7" fill="${C.slate}">${esc(CD.url || '')}</text>`;
  s += `<text x="${X + 34}" y="${y + 18}" font-size="2.8" fill="${C.slate}">Good light, no glare. Keep the black square uncovered.</text><text class="hi" x="${X + 34}" y="${y + 22.5}" font-size="2.9" fill="${C.mute}">अच्छी रोशनी रखें। काला वर्ग ढका न हो।</text>`;
  s += `<text x="${X + 34}" y="${y + 28}" font-size="2.8" fill="${C.slate}">A card laid on the DUET AR Pad works too.</text>`;
  s += scaleBar(X, PH - 14, 50, 'Must measure 50 mm: print at 100% / 100% पर छापें');
  s += `<text x="${PW - X}" y="${PH - 9}" font-size="2.3" text-anchor="end" fill="${C.mute}">© DUET STEM · free to print for teaching · models: see DUET AR credits</text>`;
  return s;
}
function cardsDoc(set) {
  const items = CD.items.filter((it) => it.card != null && (set === 'all' || it.group === set)).sort((a, b) => a.card - b.card);
  const pages = [cover(set, items)];
  const groups = set === 'all' ? CD.groups.map((g) => g.id) : [set];
  for (const gid of groups) {
    const list = items.filter((it) => it.group === gid), g = CD.groups.find((x) => x.id === gid);
    for (let i = 0; i < list.length; i += 4) pages.push(cardSheet(list.slice(i, i + 4), `DUET AR Cards · ${L3(g.name, 'en')} · ${Math.floor(i / 4) + 1}/${Math.ceil(list.length / 4)}`));
  }
  return { w: 210, h: 297, vw: 210, vh: 297, pages };
}

if (sheet === 'cards') await Promise.all(['400', '600', '700'].flatMap((w) => [document.fonts.load(`${w} 10px "Noto Sans Devanagari"`, 'अआक'), document.fonts.load(`${w} 10px Poppins`, 'Aa')])).catch(() => {});
const out = sheet === 'cards' ? cardsDoc(q.get('set') || 'all') : sheet === 'cube' ? cube() : pad(sheet === 'pad-a3' ? 'a3' : 'a4');
document.title = 'DUET ' + sheet;
const st = document.createElement('style');
st.textContent = `@page{size:${out.w}mm ${out.h}mm;margin:0}`;
document.head.appendChild(st);
const svgOf = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${out.w}mm" height="${out.h}mm" viewBox="0 0 ${out.vw} ${out.vh}">${body}</svg>`;
document.getElementById('sheet').innerHTML = out.pages ? out.pages.map((b) => `<div class="pg">${svgOf(b)}</div>`).join('') : svgOf(out.body);
window.SHEET = { sheet, w: out.w, h: out.h, pages: out.pages ? out.pages.length : 1, dictionary: DICTIONARY };
Promise.all([document.fonts.ready, ...[...document.images].map((im) => im.decode().catch(() => {}))]).then(() => { window.READY = true; });
