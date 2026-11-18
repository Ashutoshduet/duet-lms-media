// DUET AR markers: the ONE place that says which ArUco markers are printed where and how big they are.
// The tracker (tracker.js, pose.js), the printable PDFs (devtools/ar/make_print.mjs) and the test videos
// (devtools/ar/make_video.py reads markers.json, written from this file) all read these numbers, so they always agree.
//
// Dictionary: ArUco 4×4 (OpenCV DICT_4X4_50, the same codes as js-aruco2's ARUCO_4X4_1000). We use 12 of its 50 ids,
// picked so that any two of them differ in at least 6 of their 16 cells under every rotation, and none looks like
// itself turned round; so a misread is very unlikely and one wrong cell is still corrected.
// Units: millimetres on the A4 print. The A3 pad is the same picture scaled ×√2 (420 × 297 mm), so it tracks with
// the same numbers (the model simply looks √2 bigger, like the pad).

export const DICTIONARY = 'ArUco 4x4 (OpenCV DICT_4X4_50)';

// id → the 16 cells, row by row from the top-left, as a 16-bit number (1 = white cell)
export const CODES = {
  0: 0xb532, 1: 0x0f9a, 2: 0x332d, 4: 0x549e, 5: 0x79cd, 7: 0xc4f2,       // the pad
  8: 0xfeda, 9: 0xcf56, 14: 0x24b1, 15: 0x263e, 17: 0x6600, 23: 0xdd82,   // the cube
};
export const IDS = Object.keys(CODES).map(Number);

/** the 4×4 cells of a marker, rows from the top, 1 = white (the 1-cell black border around them is not included) */
export function markerBits(id) {
  const v = CODES[id]; if (v == null) throw new Error('not a DUET marker: ' + id);
  const rows = [];
  for (let r = 0; r < 4; r++) { const row = []; for (let c = 0; c < 4; c++) row.push((v >> (15 - (r * 4 + c))) & 1); rows.push(row); }
  return rows;
}

// ------------------------------------------------------------------ the DUET Pad (A4 landscape, 297 × 210 mm)
// Pad axes (also the 3D axes of the model on it): x to the right, y up out of the paper, z towards you (the bottom
// edge of the print). The origin is the centre of the stage circle, where the model stands.
// Six markers: three down each short side, so a hand, the phone's angle or the model itself never hides all of them.
export const PAD = {
  name: 'DUET Pad',
  paper: { a4: { w: 297, h: 210 }, a3: { w: 420, h: 297 } },
  marker: 44,          // black square edge, mm (A4); a cell is 44/6 = 7.33 mm
  quiet: 7.5,          // white margin kept clear round every marker, mm (at least one cell)
  stage: { r: 60 },    // the stage circle, mm
  markers: [
    { id: 0, x: -116.5, z: -73 }, { id: 1, x: 116.5, z: -73 },
    { id: 2, x: -116.5, z: 0 },   { id: 4, x: 116.5, z: 0 },
    { id: 5, x: -116.5, z: 73 },  { id: 7, x: 116.5, z: 73 },
  ],
};

// ------------------------------------------------------------------ the DUET Cube (a 56 mm paper cube)
// Cube axes: origin at the centre of the cube, x right, y up, z towards you, when the "front" face (id 8) faces you
// the right way up. Each face: its outward normal, and which way the top of its printed marker points (up).
// The net is printed with every marker upright on the sheet; the 'up' below is where that sheet-up ends after folding.
export const CUBE = {
  name: 'DUET Cube',
  edge: 56,            // mm (5.6 cm sides)
  marker: 40,          // black square edge, mm; 8 mm white margin to the folds
  faces: [
    { id: 8,  face: 'front',  n: [0, 0, 1],  up: [0, 1, 0],  net: [1, 1] },
    { id: 17, face: 'top',    n: [0, 1, 0],  up: [0, 0, -1], net: [1, 0] },
    { id: 23, face: 'bottom', n: [0, -1, 0], up: [0, 0, 1],  net: [1, 2] },
    { id: 14, face: 'back',   n: [0, 0, -1], up: [0, -1, 0], net: [1, 3] },
    { id: 15, face: 'left',   n: [-1, 0, 0], up: [0, 1, 0],  net: [0, 1] },
    { id: 9,  face: 'right',  n: [1, 0, 0],  up: [0, 1, 0],  net: [2, 1] },
  ],
  // glue flaps of the net: [face, side] (side = the edge of that face on the sheet: top/right/bottom/left)
  tabs: [['left', 'top'], ['left', 'bottom'], ['right', 'top'], ['right', 'bottom'], ['back', 'left'], ['back', 'right'], ['back', 'bottom']],
};

// ------------------------------------------------------------------ the DUET AR Cards (A6 cards, 4 on an A4 sheet)
// Each card has its own marker from a second family: 5×5 cells inside the black border (7×7 in all), 72 codes picked
// (devtools/ar/card_codes.py) so that any two differ in at least 8 of their 25 cells under every rotation, none looks
// like itself turned round, none looks like a QR code's corner square, and none reads as a pad/cube code on the 6×6 grid
// (nor a pad/cube marker as a card on the 7×7 grid). So up to 3 wrong cells are still read right and never as another card.
// Card marker ids are 100 + the index in CARD_CODES. The card also has three small solid black squares ("dots") in its
// corners: when they are seen they join the marker in the pose fit and make it much steadier (a 4× longer baseline).
export const CARD_ID0 = 100;
export const CARD_CODES = [
  0x1ee5169, 0x1914e0c, 0x09b4bce, 0x12ab10c, 0x0474ee2, 0x19ed4cb, 0x09ecba9, 0x032911b, 0x175ac81, 0x191f1c7, 0x156182d, 0x19b3a56,
  0x09a573b, 0x169c26a, 0x0aa5e46, 0x114c983, 0x1653516, 0x1aaeda8, 0x1586458, 0x1447a99, 0x1228bbc, 0x1c48b48, 0x139602f, 0x10bcd3d,
  0x0ce6c2f, 0x03ae2e7, 0x15a9562, 0x13f3043, 0x035e8f0, 0x0ef3351, 0x1cdc971, 0x124c28d, 0x1c89f87, 0x0d4ceec, 0x0d7289c, 0x02e9ef4,
  0x0e35193, 0x1bcd90e, 0x192c7a2, 0x03465c2, 0x036ee1b, 0x117e0de, 0x18cb2de, 0x0e944c8, 0x01f65bc, 0x1934af9, 0x0ca45fe, 0x05a9b49,
  0x0490f1a, 0x06a89e3, 0x1df2d44, 0x13b7b8d, 0x032da6c, 0x1556d28, 0x0a9187d, 0x1e4d9d2, 0x1a1573d, 0x10bb830, 0x071c988, 0x05acc28,
  0x0f463b5, 0x1d7f855, 0x1b24d0b, 0x0ed3ea2, 0x04cb95a, 0x0c99650, 0x01a11ec, 0x0beef34, 0x18229b2, 0x0d0e3ca, 0x11992fb, 0x045df7e,
];
export const isCardId = (id) => id >= CARD_ID0 && id < CARD_ID0 + CARD_CODES.length;
/** the 5×5 cells of a card marker, rows from the top, 1 = white */
export function cardBits(id) {
  const v = CARD_CODES[id - CARD_ID0]; if (v == null) throw new Error('not a DUET card marker: ' + id);
  const rows = [];
  for (let r = 0; r < 5; r++) { const row = []; for (let c = 0; c < 5; c++) row.push((v >> (24 - (r * 5 + c))) & 1); rows.push(row); }
  return rows;
}
// Card layout in mm, from the card's top-left corner (the card is 97 × 140.5 mm, portrait). The 3D axes of a card: the
// origin at the card's centre, x to the right, y up out of the paper, z towards the card's bottom edge (as on the pad).
export const CARD = {
  name: 'DUET AR Card',
  w: 97, h: 140.5,
  marker: { size: 52, x: 33, y: 108 },       // black square edge and centre; a cell is 52/7 = 7.4 mm; 7 mm white round it
  dots: [{ x: 9, y: 9 }, { x: 88, y: 9 }, { x: 88, y: 131.5 }],   // solid squares (top-left, top-right, bottom-right)
  dot: 9,                                    // dot edge, mm
  sheet: { w: 210, h: 297, cols: 2, rows: 2, margin: 8 },   // A4 portrait: 4 cards touching (one cut between), 8 mm margin
};

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** the 4 corners of a marker square in 3D (metres), in the order the detector reports them:
 *  top-left, top-right, bottom-right, bottom-left of the upright marker */
function squareCorners(c, n, up, size) {
  const r = cross(up, n), h = size / 2;
  const at = (sx, sy) => [c[0] + (r[0] * sx + up[0] * sy) * h, c[1] + (r[1] * sx + up[1] * sy) * h, c[2] + (r[2] * sx + up[2] * sy) * h];
  return [at(-1, 1), at(1, 1), at(1, -1), at(-1, -1)];
}

/** a "board": every marker of the pad or the cube with its corners in 3D, in metres. The tracker fits all of them. */
export function board(kind) {
  const m = 0.001;
  if (kind === 'pad') {
    return {
      kind, size: PAD.paper.a4.w * m,
      markers: PAD.markers.map((k) => ({ id: k.id, corners: squareCorners([k.x * m, 0, k.z * m], [0, 1, 0], [0, 0, -1], PAD.marker * m) })),
    };
  }
  if (kind === 'cube') {
    const e = CUBE.edge * m;
    return {
      kind, size: e,
      markers: CUBE.faces.map((f) => ({ id: f.id, face: f.face, n: f.n, corners: squareCorners(f.n.map((v) => v * e / 2), f.n, f.up, CUBE.marker * m) })),
    };
  }
  if (isCardId(kind)) return cardBoard(kind);
  throw new Error('board: pad, cube or a card id');
}

/** one card: its marker and its three dots (corners in metres, card axes; dots are matched by position, not by id) */
const cardBoards = new Map();
export function cardBoard(id) {
  if (cardBoards.has(id)) return cardBoards.get(id);
  const m = 0.001, cx = CARD.w / 2, cz = CARD.h / 2, at = (p) => [(p.x - cx) * m, 0, (p.y - cz) * m];
  const b = {
    kind: 'card', id, size: CARD.w * m, extent: [CARD.w * m, CARD.h * m],
    markers: [{ id, corners: squareCorners(at(CARD.marker), [0, 1, 0], [0, 0, -1], CARD.marker.size * m) }],
    dots: CARD.dots.map((d) => ({ c: at(d), corners: squareCorners(at(d), [0, 1, 0], [0, 0, -1], CARD.dot * m) })),
  };
  cardBoards.set(id, b); return b;
}

/** everything above as plain JSON (for the Python test-picture makers and for the docs) */
export function asJSON() {
  return { dictionary: DICTIONARY, codes: CODES, pad: PAD, cube: CUBE, card: CARD, cardId0: CARD_ID0, cardCodes: CARD_CODES,
    boards: { pad: board('pad'), cube: board('cube'), card100: cardBoard(CARD_ID0) } };
}
