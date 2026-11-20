// DUET Robotics Lab 360, batch 2: what the robots do, as plain numbers (no 3D here, so node tests can run it).
// Each robot reads its servos and motors from the bench (sim.js parts) and writes its sensors back into the bench parts:
//   ArmSim   4-joint arm: forward kinematics, the claw, a wooden block picked up at A and put down at B
//   CarSim   2WD car: wheel speeds -> position (differential drive), IR sensors over the black tape, ultrasonic rays,
//            walls and boxes, laps, the parking box
//   BinSim   smart dustbin: a hand comes near, the lid opens, a ball of paper goes in
//   HydSim   hydraulic arm: two syringes and a tube of water (Pascal's law), or of air
// Units: mm, s, N. Angles of servos in degrees (as myServo.write()).
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ------------------------------------------------------------------ the arm
export const ARMG = { h0: 78, L1: 105, L2: 100, Lc: 62, grip: 50, cube: 25, gapMax: 44, gOpen: 30, gShut: 95 };
export const ARM_POS = [345, -3, -40]; // where the arm stands on the desk (bench mm)
// claw gap (mm) for a gripper servo angle: 30° = wide open (44 mm), 95° = shut
export const gapOf = (g) => clamp(ARMG.gapMax * (ARMG.gShut - g) / (ARMG.gShut - ARMG.gOpen), 0, ARMG.gapMax);
export const angleForGap = (gap) => ARMG.gShut - gap / ARMG.gapMax * (ARMG.gShut - ARMG.gOpen);
// where the joints are, arm-local (the base's centre on the desk is 0, y up): base angle b (0 = right, 90 = towards you,
// 180 = left), shoulder s (0 = forward flat, 90 = straight up), elbow e (180 = straight on, 90 = a right angle down)
export function armFK(b, s, e) {
  const A = ARMG; const dx = Math.cos(b * D2R), dz = Math.sin(b * D2R);
  const e1 = s * D2R, e2 = (s + e - 180) * D2R;
  const r1 = A.L1 * Math.cos(e1), y1 = A.h0 + A.L1 * Math.sin(e1);
  const pt = (L) => { const r = r1 + L * Math.cos(e2), y = y1 + L * Math.sin(e2); return [r * dx, y, r * dz, r]; };
  const el = [r1 * dx, y1, r1 * dz], wr = pt(A.L2), gp = pt(A.L2 + A.grip), tip = pt(A.L2 + A.Lc);
  return { elbow: el, wrist: wr.slice(0, 3), grip: gp.slice(0, 3), tip: tip.slice(0, 3), reach: Math.round(gp[3]), height: Math.round(gp[1]) };
}
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export class ArmSim {
  // level: 1 aim at a flag, 2 touch a ball (shoulder), 3 touch a ball (all joints), 4 pick and place, 5 joystick
  constructor(level) {
    this.level = level; const A = ARMG;
    this.A = armFK(140, 45, 66).grip; this.B = armFK(40, 45, 66).grip; this.A[1] = this.B[1] = A.cube / 2;
    this.flagAngle = 120; this.ball = level === 2 ? armFK(60, 100, 90).grip : armFK(100, 70, 120).grip;
    this.reset();
  }
  reset() { this.cube = { p: this.A.slice(), held: false, vy: 0, settled: true, placed: false }; this.flags = new Set(); this.aimT = 0; this.touchT = 0; this.min = {}; this.max = {}; }
  // every frame: the servo angles (null for a joint that gets no signal: it stays where it is)
  update(dt, ang) {
    const A = ARMG; const fk = armFK(ang.b, ang.s, ang.e); this.fk = fk; this.ang = ang;
    for (const k of ['b', 's', 'e', 'g']) { this.min[k] = Math.min(this.min[k] ?? 999, ang[k]); this.max[k] = Math.max(this.max[k] ?? -999, ang[k]); }
    const c = this.cube; const gap = gapOf(ang.g); this.gap = gap;
    const near = dist3(fk.grip, c.p) < 13;
    // the claw: closing round the block stops at the block's width (the servo pushes: its angle cannot go further)
    this.limit = (near || c.held) ? angleForGap(A.cube) : null;
    if (!c.held && near && gap <= A.cube + 1.2) { c.held = true; c.placed = false; c.settled = false; this.flags.add('grabbed'); }
    if (c.held && gap > A.cube + 2.5) { c.held = false; c.vy = 0; this.flags.add('released'); }
    if (c.held) { c.p = fk.grip.slice(); if (c.p[1] > A.cube / 2 + 30) this.flags.add('lifted'); }
    else if (c.p[1] > A.cube / 2 + 0.6) { c.vy -= 9810 * dt; c.p[1] = Math.max(A.cube / 2, c.p[1] + c.vy * dt); }
    else if (!c.settled) { c.p[1] = A.cube / 2; c.vy = 0; c.settled = true; this.landed(); } // it lands (or was let go on the desk)
    if (fk.tip[1] < -1) this.flags.add('desk'); // the claw pressed into the desk
    // level goals
    if (this.level === 1) { this.aimT = Math.abs(ang.b - this.flagAngle) < 4 ? this.aimT + dt : 0; if (this.aimT > 0.6) this.flags.add('aimed'); }
    if (this.level === 2 || this.level === 3) { this.ballD = Math.round(dist3(fk.grip, this.ball)); this.touchT = this.ballD < 16 ? this.touchT + dt : 0; if (this.touchT > 0.5) this.flags.add('touched'); }
  }
  landed() { const c = this.cube; const dB = Math.hypot(c.p[0] - this.B[0], c.p[2] - this.B[2]); c.placed = dB < 28; if (c.placed) this.flags.add('placed'); }
}

// ------------------------------------------------------------------ the car
export const CARG = { track: 150, sensZ: 168, sensX: 17, usZ: 150, bodyZ: 60, r: 112, tape: 19 };
export const ARENA_POS = [2600, 0, 0]; // the robot floor, away to the right of the desk (bench mm)
export const ROOM = { w: 1600, d: 1100 };
// the line: a rounded rectangle 1000 × 660 with an S-bend on the far side (centre of the tape, arena mm)
export function linePoints() {
  const pts = []; const x0 = 500, z0 = 330, R = 210;
  const arc = (cx, cz, a0, a1) => { for (let i = 0; i <= 14; i++) { const a = a0 + (a1 - a0) * i / 14; pts.push([cx + R * Math.cos(a), cz + R * Math.sin(a)]); } };
  for (let i = 0; i <= 20; i++) pts.push([-(x0 - R) + i / 20 * 2 * (x0 - R), z0]); // near side, left to right
  arc(x0 - R, z0 - R, Math.PI / 2, 0); // right side going away
  for (let i = 1; i < 10; i++) pts.push([x0, z0 - R - i / 10 * (2 * z0 - 2 * R)]);
  arc(x0 - R, -z0 + R, 0, -Math.PI / 2);
  for (let i = 1; i < 40; i++) { const x = (x0 - R) - i / 40 * 2 * (x0 - R); const u = (x + (x0 - R)) / (2 * (x0 - R)); pts.push([x, -z0 + 46 * Math.sin(u * Math.PI * 2) * Math.sin(u * Math.PI)]); } // the S-bend
  arc(-(x0 - R), -z0 + R, -Math.PI / 2, -Math.PI);
  for (let i = 1; i < 10; i++) pts.push([-x0, -z0 + R + i / 10 * (2 * z0 - 2 * R)]);
  arc(-(x0 - R), z0 - R, Math.PI, Math.PI / 2);
  pts.pop(); return pts;
}
// distance from a point to the closed polyline, and how far along it (0..1)
function nearLine(pts, x, z) {
  let best = Infinity, at = 0; const n = pts.length; let L = 0; const seg = [];
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); seg.push(l); L += l; }
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n]; const dx = b[0] - a[0], dz = b[1] - a[1]; const l2 = dx * dx + dz * dz || 1;
    const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1); const d = Math.hypot(a[0] + t * dx - x, a[1] + t * dz - z);
    if (d < best) { best = d; at = (acc + t * seg[i]) / L; } acc += seg[i];
  }
  return { d: best, at };
}
export const CAR_CFG = {
  bt: { line: false, start: [-420, 330, Math.PI / 2], park: [380, 20, 230, 260], boxes: [[-80, -40, 120, 120, 120], [180, 120, 90, 90, 100, 0.4]] },
  line: { line: true, start: [-100, 330, Math.PI / 2], boxes: [] },
  avoid: { line: false, room: [2000, 1400], start: [-720, -300, Math.PI / 2], boxes: [[-300, 260, 170, 130, 150], [330, -210, 210, 150, 160], [560, 400, 150, 150, 150, 0.5]] },
  pi: { line: false, start: [-560, 300, Math.PI / 2], park: [195, -350, 230, 260], boxes: [[-250, -150, 140, 120, 120], [520, 120, 100, 100, 100, 0.4]] }, // batch 6: the Raspberry Pi car (a timed route that ends in P)
  // batch 14 (Class 7): a table robot that must not fall off, a light-seeker, a dancer, and a lap counter
  edge: { line: false, table: [1000, 700], room: [6000, 6000], start: [-120, -40, 1.27], boxes: [] }, // a school desk 1000 × 700 mm, 750 mm above the floor
  light: { line: false, room: [2000, 1400], start: [-560, 60, 2.2], boxes: [], lamps: { A: [600, -360], B: [-600, -400], C: [0, -540] }, lamp0: 'A' }, // a torch on a stand at A, B or C
  dance: { line: false, room: [1600, 1100], start: [0, -60, 0], boxes: [], dance: [0, -60, 300] }, // the dance mat: its centre spot and ring
  lap: { line: true, start: [-100, 330, Math.PI / 2], boxes: [], marker: [150, 268, 46, 34] }, // the line track and a lap marker beside it (x, z, along, across)
  maze: null, // batch 18 (Class 9): the plywood maze (below)
};
// batch 18: a maze of 4 × 3 cells, 450 mm each, plywood walls 18 mm thick and 150 mm high; the ways between cells as
// [i, j, 'E' | 'S'] (cell i across from the left, j down from the far side); every other side of a cell is a wall.
//   A  all its walls join up (to the outside wall): keep a hand on the left wall and you come out. FINISH in cell (3, 0).
//   B  FINISH in the middle, inside a C of walls that touches nothing: an island. The left hand goes round and round it.
export const MAZE = { cell: 450, cols: 4, rows: 3, t: 18, h: 150, start: [0, 2], fin: 300,
  A: { ways: [[0, 0, 'E'], [0, 0, 'S'], [0, 1, 'S'], [1, 0, 'S'], [1, 1, 'S'], [1, 2, 'E'], [2, 2, 'E'], [2, 0, 'S'], [2, 1, 'E'], [3, 0, 'S'], [3, 1, 'S']], finish: [3, 0] },
  B: { ways: [[0, 0, 'E'], [1, 0, 'E'], [2, 0, 'E'], [1, 1, 'E'], [2, 1, 'E'], [0, 2, 'E'], [1, 2, 'E'], [2, 2, 'E'], [0, 0, 'S'], [0, 1, 'S'], [3, 0, 'S'], [3, 1, 'S']], finish: [1, 1] } };
export const mazeXY = (i, j) => { const M = MAZE; return [-M.cols * M.cell / 2 + (i + 0.5) * M.cell, -M.rows * M.cell / 2 + (j + 0.5) * M.cell]; };
export function mazeWalls(k = 'A') { // the inside walls, joined into straight runs: [x, z, w, d, h]
  const M = MAZE; const way = new Set(M[k].ways.map((w) => w.join())); const W = M.cols * M.cell / 2, D = M.rows * M.cell / 2; const out = [];
  for (let i = 0; i < M.cols - 1; i++) { let j0 = null; for (let j = 0; j <= M.rows; j++) { const wall = j < M.rows && !way.has([i, j, 'E'].join()); if (wall && j0 === null) j0 = j; if (!wall && j0 !== null) { const x = -W + (i + 1) * M.cell; out.push([x, -D + (j0 + j) * M.cell / 2, M.t, (j - j0) * M.cell + M.t, M.h]); j0 = null; } } }
  for (let j = 0; j < M.rows - 1; j++) { let i0 = null; for (let i = 0; i <= M.cols; i++) { const wall = i < M.cols && !way.has([i, j, 'S'].join()); if (wall && i0 === null) i0 = i; if (!wall && i0 !== null) { const z = -D + (j + 1) * M.cell; out.push([-W + (i0 + i) * M.cell / 2, z, (i - i0) * M.cell + M.t, M.t, M.h]); i0 = null; } } }
  return out;
}
export function mazeCfg(k = 'A') {
  const [sx, sz] = mazeXY(...MAZE.start); const [fx, fz] = mazeXY(...MAZE[k].finish);
  return { line: false, room: [MAZE.cols * MAZE.cell, MAZE.rows * MAZE.cell], start: [sx, sz + 60, Math.PI], boxes: mazeWalls(k), finish: [fx, fz, MAZE.fin, MAZE.fin], maze: k };
}
CAR_CFG.maze = mazeCfg('A');
// where the maze robot's sensors sit (car mm): the front HC-SR04, the left one (looking 90° left), the IR under the nose
export const CAR18 = { usLX: 52, usLZ: 70, finZ: 150 };
// batch 14: where the extra sensors sit on the car (car mm: +x the car's left, +z forward)
export const CAR14 = { edgeX: 50, edgeZ: 200, ldrX: 42, ldrZ: 172, ldrA: 32, markX: 58, markZ: 112, lampI: 40, amb: 4 }; // ldrA: each LDR looks this many degrees out; lampI: the torch's lux at 1 m
export class CarSim {
  constructor(kind) {
    this.kind = kind; this.cfg = CAR_CFG[kind]; this.pts = this.cfg.line ? linePoints() : null;
    this.walls(); this.reset();
  }
  // batch 18: the maze robot's maze, A or B (it stays chosen across Runs)
  setMaze(k) { this.cfg = mazeCfg(k); this.dead = null; this.walls(); this.reset(); }
  walls() { // walls and boxes as segments (for the ultrasonic rays) and rectangles (for bumps)
    const [rw, rd] = this.cfg.room || [ROOM.w, ROOM.d]; this.room = [rw, rd]; const W = rw / 2, Dd = rd / 2; this.rects = [];
    for (const [x, z, w, d, , rot] of this.cfg.boxes) this.rects.push({ x, z, w, d, rot: rot || 0 });
    this.segs = [[-W, -Dd, W, -Dd], [W, -Dd, W, Dd], [W, Dd, -W, Dd], [-W, Dd, -W, -Dd]];
    for (const r of this.rects) { const c = Math.cos(r.rot), s = Math.sin(r.rot); const k = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [r.x + a * r.w / 2 * c + b * r.d / 2 * s, r.z - a * r.w / 2 * s + b * r.d / 2 * c]); for (let i = 0; i < 4; i++) this.segs.push([...k[i], ...k[(i + 1) % 4]]); }
  }
  reset() {
    const [x, z, h] = this.cfg.start; this.x = x; this.z = z; this.h = h; this.vl = this.vr = 0; this.odo = 0; this.bumps = 0; this.bumpT = 0; this.flags = new Set();
    this.lap = { cp: 0, t: 0, best: null, n: 0 }; this.lostT = 0; this.turns = 0; this.lastTurn = 0; this.parkT = 0; this.t = 0; this.offT = 0;
    // batch 14
    this.fell = null; this.fallT = 0; this.saves = 0; this.edgeOn = false; // the table robot: how it fell (null: it has not), edges it backed away from
    this.lamp = this.cfg.lamp0; this.foundT = 0; this.found = new Set(); // the light-seeker: where the torch stands (back at A on each Run), the spots it reached
    this.spin = 0; this.spinning = false; this.lastSpin = null; this.spins = []; // the dancer: the turn of the spin going on, and of the last ones (degrees)
    this.marks = 0; this.onMark = false; // the lap counter: times the side sensor passed the marker
    this.cellK = null; this.path = []; this.cells = new Set(); this.loops = 0; this.outT = 0; this.onFin = false; this.solvedT = null; this.solvedBumps = null; // batch 18: the maze
    if (this.cfg.maze && !this.dead) { const n = {}; const Z = MAZE[this.cfg.maze]; for (const [i, j, d] of Z.ways) { const b = d === 'E' ? [i + 1, j] : [i, j + 1]; for (const c of [[i, j], b]) n[c.join()] = (n[c.join()] || 0) + 1; } this.dead = new Set(Object.keys(n).filter((c) => n[c] === 1 && c !== MAZE.start.join() && c !== Z.finish.join())); }
  }
  // local car point (lx, lz) -> arena (x, z). Forward is local +z; the car's left is local +x.
  world(lx, lz) { const c = Math.cos(this.h), s = Math.sin(this.h); return [this.x + lx * c + lz * s, this.z - lx * s + lz * c]; }
  onBlack(lx, lz) { if (!this.pts) return false; const [x, z] = this.world(lx, lz); return nearLine(this.pts, x, z).d < CARG.tape / 2; }
  sensors() { return { L: this.onBlack(CARG.sensX, CARG.sensZ), R: this.onBlack(-CARG.sensX, CARG.sensZ) }; }
  // the ultrasonic: five rays in its cone (±15°: the HC-SR04's beam), the nearest echo, in cm (400 cm when nothing answers)
  usCm(scanDeg) {
    const [sx, sz] = this.world(0, CARG.usZ); let best = 4000;
    for (const da of [-15, -7, 0, 7, 15]) {
      const a = this.h + (scanDeg - 90 + da) * D2R; const dx = Math.sin(a), dz = Math.cos(a);
      for (const [x1, z1, x2, z2] of this.segs) { const ex = x2 - x1, ez = z2 - z1; const den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue; const t = ((x1 - sx) * ez - (z1 - sz) * ex) / den, u = ((x1 - sx) * dz - (z1 - sz) * dx) / den; if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t); }
    }
    return Math.round(Math.min(400, best / 10));
  }
  // the deepest overlap of the car's body (a circle round its middle) with a wall or a box: [nx, nz, depth] or null
  contact() {
    const [cx, cz] = this.world(0, CARG.bodyZ); const r = CARG.r; const W = this.room[0] / 2, Dd = this.room[1] / 2; let best = null;
    const take = (nx, nz, d) => { if (d > 0 && (!best || d > best[2])) best = [nx, nz, d]; };
    take(1, 0, r - W - cx); take(-1, 0, cx + r - W); take(0, 1, r - Dd - cz); take(0, -1, cz + r - Dd);
    for (const b of this.rects) {
      const c = Math.cos(b.rot), s = Math.sin(b.rot); const lx = (cx - b.x) * c - (cz - b.z) * s, lz = (cx - b.x) * s + (cz - b.z) * c;
      const qx = clamp(lx, -b.w / 2, b.w / 2), qz = clamp(lz, -b.d / 2, b.d / 2); const d = Math.hypot(lx - qx, lz - qz) || 1e-6; const rr = r * 0.85;
      if (d < rr) { const nx = (lx - qx) / d, nz = (lz - qz) / d; take(nx * c + nz * s, -nx * s + nz * c, rr - d); }
    }
    return best;
  }
  // batch 14: off the table top? (the table robot)
  offTable(x, z) { const T = this.cfg.table; return !!T && (Math.abs(x) > T[0] / 2 || Math.abs(z) > T[1] / 2); }
  edgeSens() { const C = CAR14; return { L: this.offTable(...this.world(C.edgeX, C.edgeZ)), R: this.offTable(...this.world(-C.edgeX, C.edgeZ)) }; }
  // the torch's light at an LDR on the car (lux): brighter the nearer it is (1 / d²) and the straighter it looks at it
  lampAt() { const L = this.cfg.lamps && this.cfg.lamps[this.lamp]; return L || null; }
  ldrLux(side) {
    const C = CAR14, L = this.lampAt(); if (!L) return C.amb; const lx = side * C.ldrX; const [px, pz] = this.world(lx, C.ldrZ);
    const a = this.h + side * C.ldrA * D2R; const dx = L[0] - px, dz = L[1] - pz; const d = Math.max(60, Math.hypot(dx, dz));
    const cos = (Math.sin(a) * dx + Math.cos(a) * dz) / d; const k = Math.max(0, cos); const m = d / 1000;
    return C.amb + C.lampI * Math.pow(k, 1.5) / (m * m);
  }
  lampDist() { const L = this.lampAt(); if (!L) return null; const [fx, fz] = this.world(0, CARG.usZ); return Math.round(Math.hypot(L[0] - fx, L[1] - fz)); }
  // batch 18: an HC-SR04 anywhere on the car: at car (lx, lz), looking dir degrees left of straight ahead
  usFrom(lx, lz, dir) {
    const [sx, sz] = this.world(lx, lz); let best = 4000;
    for (const da of [-15, -7, 0, 7, 15]) {
      const a = this.h + (dir + da) * D2R; const dx = Math.sin(a), dz = Math.cos(a);
      for (const [x1, z1, x2, z2] of this.segs) { const ex = x2 - x1, ez = z2 - z1; const den = dx * ez - dz * ex; if (Math.abs(den) < 1e-9) continue; const t = ((x1 - sx) * ez - (z1 - sz) * ex) / den, u = ((x1 - sx) * dz - (z1 - sz) * dx) / den; if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t); }
    }
    return Math.round(Math.min(400, best / 10));
  }
  mazeFront() { return this.usFrom(0, CARG.usZ, 0); }
  mazeLeft() { return this.usFrom(CAR18.usLX, CAR18.usLZ, 90); }
  finSens() { const F = this.cfg.finish; if (!F) return false; const [x, z] = this.world(0, CAR18.finZ); return Math.abs(x - F[0]) < F[2] / 2 && Math.abs(z - F[1]) < F[3] / 2; }
  cellAt() { const M = MAZE; const [x, z] = this.world(0, CARG.bodyZ); return [Math.floor((x + M.cols * M.cell / 2) / M.cell), Math.floor((z + M.rows * M.cell / 2) / M.cell)]; }
  mazeCheck(dt, v) { // the cells it has been in (in order), a dead end reached, out on the FINISH square (and stopped there)
    const [i, j] = this.cellAt(); const k = i + ',' + j;
    if (k !== this.cellK) { this.cellK = k; this.path.push(k); this.cells.add(k); if (this.dead.has(k)) this.flags.add('deadend'); const F = MAZE[this.cfg.maze].finish; if (i === F[0] && j === F[1]) this.flags.add('atfinish');
      if (k === MAZE.start.join() && this.cells.size >= 8 && !this.flags.has('atfinish')) { this.flags.add('loop'); this.loops = (this.loops || 0) + 1; } } // back at START, all the way round, and no FINISH
    this.onFin = this.finSens(); if (this.onFin) this.flags.add('finline');
    this.outT = this.onFin && Math.abs(v) < 15 && Math.abs(this.vr - this.vl) < 15 ? this.outT + dt : 0;
    if (this.outT > 0.5 && !this.flags.has('solved')) { this.flags.add('solved'); this.solvedT = this.t; this.solvedBumps = this.bumps; }
  }
  markSens() { const M = this.cfg.marker; if (!M) return false; const [x, z] = this.world(CAR14.markX, CAR14.markZ); return Math.abs(x - M[0]) < M[2] / 2 && Math.abs(z - M[1]) < M[3] / 2; }
  // every frame: the wheels' speeds along the floor (mm/s, + is forward)
  update(dt, vl, vr) {
    this.t += dt; if (this.fell) { this.fallT += dt; this.vl = this.vr = 0; return; } // (a robot that fell off the table lies on the floor)
    this.vl = vl; this.vr = vr;
    const v = (vl + vr) / 2, w = (vr - vl) / CARG.track;
    // small steps, so a fast turn stays round
    const n = Math.max(1, Math.ceil(Math.abs(w * dt) / 0.05)); for (let i = 0; i < n; i++) { const d = dt / n; this.h += w * d; this.x += Math.sin(this.h) * v * d; this.z += Math.cos(this.h) * v * d; }
    // a wall or a box pushes the car back out (it can still turn while it scrapes); driving into it is a bump
    const c = this.contact(); this.blocked = !!c;
    if (c) { this.x += c[0] * c[2]; this.z += c[1] * c[2]; const vn = (Math.sin(this.h) * c[0] + Math.cos(this.h) * c[1]) * v; const head = v > 60 && vn < -0.6 * v; if (head && this.t - this.bumpT > 0.8) { this.bumps++; this.flags.add('bump'); } if (head) this.bumpT = this.t; } // (a scrape along the side does not count)
    this.odo += Math.abs(v) * dt; if (this.odo > 600) this.flags.add('moved');
    if (v > 40 && Math.abs(w) < 0.3) this.flags.add('fwd'); if (v < -40) this.flags.add('back');
    if (Math.abs(w) > 1.2 && Math.abs(v) < 60) { this.flags.add(w > 0 ? 'left' : 'right'); }
    if (Math.abs(w) > 1.2 && this.t - this.lastTurn > 1.2) { this.turns++; this.lastTurn = this.t; }
    if (this.pts) this.followLine(dt, v);
    if (this.cfg.park) { const [x, z, pw, pd] = this.cfg.park; const [cx, cz] = this.world(0, CARG.bodyZ * 0.6); const inside = Math.abs(cx - x) < pw / 2 - 30 && Math.abs(cz - z) < pd / 2 - 30; this.parkT = inside && Math.abs(v) < 15 ? this.parkT + dt : 0; if (this.parkT > 0.8) this.flags.add('parked'); }
    if (this.kind === 'avoid' && this.odo > 1500 && this.turns >= 2 && !this.flags.has('explored')) { this.flags.add('explored'); this.exploredBumps = this.bumps; } // bumps before it had explored
    if (this.cfg.table) this.tableCheck();
    if (this.cfg.lamps) this.lampCheck(dt, v);
    if (this.cfg.dance) this.danceCheck(dt, v, w);
    if (this.cfg.maze) this.mazeCheck(dt, v);
    if (this.cfg.marker) { const on = this.markSens(); if (on && !this.onMark) { this.marks++; this.flags.add('mark'); } this.onMark = on; }
  }
  // batch 14: a wheel or the caster over the edge, and the robot falls; an edge seen and backed away from is a save
  tableCheck() {
    const sup = [[CARG.track / 2, 0, 'L'], [-CARG.track / 2, 0, 'R'], [0, 150, 'F']];
    for (const [lx, lz, k] of sup) if (this.offTable(...this.world(lx, lz))) { this.fell = { k, x: this.x, z: this.z, h: this.h }; this.fallT = 0; this.flags.add('fell'); return; }
    const s = this.edgeSens(); const any = s.L || s.R;
    if (!any && this.edgeOn) { this.saves++; if (this.saves >= 3) this.flags.add('saved3'); }
    if (any) this.flags.add('edge'); this.edgeOn = any;
  }
  lampCheck(dt, v) { // at the torch: the front within 600 mm of it, stopped for half a second (a shy robot stops more than 320 mm away)
    const d = this.lampDist(); this.foundT = d < 600 && Math.abs(v) < 15 && Math.abs(this.vr - this.vl) < 15 ? this.foundT + dt : 0;
    if (this.foundT > 0.5 && !this.found.has(this.lamp)) { this.found.add(this.lamp); this.foundD = d; this.flags.add('found'); this.flags.add('found' + this.lamp); if (d > 320) this.flags.add('foundFar'); }
  }
  danceCheck(dt, v, w) { // a spin: turning on the spot; when it ends, how far it turned
    const sp = Math.abs(w) > 0.8 && Math.abs(v) < 40;
    if (sp) { if (!this.spinning) { this.spinning = true; this.spin = 0; } this.spin += w * dt; }
    else if (this.spinning && Math.abs(w) < 0.3) { this.spinning = false; const deg = Math.round(this.spin / D2R); if (Math.abs(deg) > 25) { this.lastSpin = deg; this.spins.push(deg); this.flags.add(deg > 0 ? 'spinL' : 'spinR'); if (Math.abs(Math.abs(deg) - 360) <= 20) this.flags.add('fullspin'); } }
    const [cx, cz] = this.cfg.dance; this.fromSpot = Math.round(Math.hypot(this.x - cx, this.z - cz));
  }
  followLine(dt, v) {
    const near = nearLine(this.pts, ...this.world(0, CARG.sensZ * 0.6)); this.off = Math.round(near.d);
    this.offT = near.d > 70 ? this.offT + dt : 0; if (this.offT > 1.0) this.flags.add('lost');
    // laps: four quarters in order, then the start again
    const q = Math.floor(near.at * 4) % 4; const L = this.lap; L.t += dt;
    if (near.d < 60 && v > 10) { if (q === (L.cp + 1) % 4) { L.cp = q; if (q === 0) { L.n++; L.last = L.t; L.best = L.best ? Math.min(L.best, L.t) : L.t; L.t = 0; this.flags.add('lap'); } } }
  }
}

// ------------------------------------------------------------------ the smart dustbin
export const BIN_POS = [345, -3, -20];
export class BinSim {
  constructor() { this.reset(); }
  reset() { this.hand = 70; this.mode = 'idle'; this.mt = 0; this.paper = { s: 'hand', y: 0, z: 0 }; this.flags = new Set(); this.lid = 0; this.openAt = null; }
  wave() { this.mode = 'wave'; this.mt = 0; this.paper = { s: 'hand' }; }
  // lid servo angle (0 closed .. 100 open) -> lid angle; the hand's distance from the sensor (cm)
  update(dt, servoDeg) {
    this.lid = clamp((servoDeg || 0) * 0.92, 0, 95);
    if (this.mode === 'wave') { // the hand comes in, waits, drops the paper, goes away
      this.mt += dt; const t = this.mt;
      this.hand = t < 1.4 ? 70 - 60 * (t / 1.4) : t < 4.0 ? 10 : t < 5.4 ? 10 + 60 * ((t - 4.0) / 1.4) : 70;
      if (t > 2.6 && this.paper.s === 'hand') { this.paper = { s: this.lid > 55 ? 'in' : 'bounce', t: 0 }; this.flags.add(this.paper.s === 'in' ? 'binned' : 'missed'); }
      if (t > 5.6) this.mode = 'idle';
    }
    if (this.paper.s === 'in' || this.paper.s === 'bounce') this.paper.t += dt;
    if (this.lid > 55 && this.hand < 40) { this.flags.add('opened'); this.openAt = Math.max(this.openAt || 0, this.hand); }
    if (this.flags.has('binned') && this.hand > 40 && this.lid < 5) this.flags.add('closed');
    return this.hand < 60 ? this.hand : 180; // what the sensor hears: the hand, or the far wall
  }
  noteOpening() { if (this.lid > 20 && this.prevLid <= 20) this.lastOpenAt = this.hand; this.prevLid = this.lid; }
}

// ------------------------------------------------------------------ the hydraulic arm
export const HYD_POS = [345, -3, -10];
export const SYR = { 5: { d: 12.0, L: 56 }, 10: { d: 14.5, L: 64 }, 20: { d: 19.1, L: 76 } }; // inner diameter, stroke (mm)
export const HYDG = { pivot: [0, 150], arm: 220, lever: 60, mount: [60, 20], phi0: -25, phi1: 32, load: 0.08, armM: 0.015, fric: 0.9, tube: 3300 }; // load: the cup of coins (kg); tube: the air or water in the tube and the nozzles (mm³)
export const areaCm2 = (ml) => Math.PI * (SYR[ml].d / 20) ** 2;
export function slaveLen(phiDeg) { const H = HYDG; const p = phiDeg * D2R; const qx = H.lever * Math.cos(p), qy = H.pivot[1] + H.lever * Math.sin(p); return Math.hypot(qx - H.mount[0], qy - H.mount[1]); }
export class HydSim {
  constructor() { this.master = 10; this.slave = 10; this.fluid = 'water'; this.push = 0; this.flags = new Set(); this.L0 = slaveLen(HYDG.phi0); this.Lmax = slaveLen(HYDG.phi1); this.update(0); }
  // push: 0..1 of the master's stroke
  update() {
    const H = HYDG, Am = areaCm2(this.master) * 100, As = areaCm2(this.slave) * 100; // mm²
    const d1 = this.push * SYR[this.master].L; let V = Am * d1; // mm³ pushed
    // the force the lift syringe needs to hold the arm up (torque of the coins and the arm about the pivot)
    const phi = this.phi ?? H.phi0; const lever = this.leverArm(phi);
    const torque = (H.load * (H.arm - 6) + H.armM * H.arm / 2) * 9.81 * Math.cos(phi * D2R) / 1000; // N·m
    const F2 = torque / (lever / 1000) + H.fric; const P = F2 / (As * 1e-6); // Pa
    if (this.fluid === 'air') { const V0 = Am * SYR[this.master].L + H.tube; V -= V0 * P / (101325 + P); } // all the air in it squeezes up (Boyle: p × V stays the same) until it can hold the load
    const ext = Math.max(0, V / As); const L = Math.min(this.L0 + ext, this.Lmax, this.L0 + SYR[this.slave].L);
    this.phi = this.solvePhi(L); this.d1 = d1; this.d2 = L - this.L0;
    this.F2 = F2; this.P = P; this.F1 = P * Am * 1e-6; this.Am = Am / 100; this.As = As / 100; // (the lift syringe's friction is in F2)
    if (this.push > 0.05) this.flags.add('pushed');
    if (this.phi > 15 && this.fluid === 'water') this.flags.add('lifted');
    if (this.fluid === 'water' && this.push > 0.6 && this.phi > H.phi0 + 10) { if (this.master > this.slave) this.flags.add('bigPush'); if (this.master < this.slave) this.flags.add('smallPush'); } // (a small syringe lifts only a little: it has less water to give)
    if (this.fluid === 'air' && this.push > 0.6) this.flags.add('airTried');
    return this;
  }
  leverArm(phi) { // distance from the pivot to the line of the lift syringe (mm)
    const H = HYDG; const p = phi * D2R; const qx = H.lever * Math.cos(p), qy = H.pivot[1] + H.lever * Math.sin(p); const bx = H.mount[0], by = H.mount[1];
    const dx = qx - bx, dy = qy - by; return Math.abs(dx * (by - H.pivot[1]) - dy * (bx - H.pivot[0])) / Math.hypot(dx, dy);
  }
  solvePhi(L) { let lo = HYDG.phi0, hi = HYDG.phi1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (slaveLen(m) < L) lo = m; else hi = m; } return (lo + hi) / 2; }
}

// ------------------------------------------------------------------ batch 14: the car's extra sensors into the bench
// The table robot's IR modules (irL, irR) see the table (near: OUT LOW) or nothing past the edge (OUT HIGH); the
// light-seeker's LDRs (ldrL, ldrR) get the torch's lux; the lap counter's side IR (irM) sees the black marker.
export function carFeed(sim, lab) {
  const byTag = (t) => lab.byTag(t); const bump = () => { lab.stateV++; lab.instKey = null; };
  const ir = (tag, black) => { const p = byTag(tag); if (!p) return; p.state.ext = true; const d = black ? 40 : 1; if (p.state.dist !== d) { p.state.dist = d; bump(); } };
  const k = sim.kind;
  if (k === 'edge' && !sim.fell) { const s = sim.edgeSens(); ir('irL', s.L); ir('irR', s.R); }
  if (k === 'lap') { const s = sim.sensors(); ir('irL', s.L); ir('irR', s.R); ir('irM', sim.markSens()); }
  if (k === 'maze') { // batch 18: the front and left HC-SR04 hear the walls, the IR under the nose sees the black FINISH square
    for (const [tag, d] of [['us1', sim.mazeFront()], ['us2', sim.mazeLeft()]]) { const p = byTag(tag); if (p) { p.state.ext = true; if (p.state.dist !== d) p.state.dist = d; } }
    ir('irM', sim.finSens());
  }
  if (k === 'light') for (const [tag, side] of [['ldrL', 1], ['ldrR', -1]]) { const p = byTag(tag); if (!p) continue; p.state.ext = true; const lx = Math.round(sim.ldrLux(side) * 10) / 10; if (p.state.lux !== lx) { p.state.lux = lx; bump(); } }
}
