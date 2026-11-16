// DUET Robotics Lab 360: a small DC circuit solver (modified nodal analysis).
// Node 0 is ground (the board's GND). Every source has an internal resistance, so all elements are stamped as
// conductances and current sources (Norton form). Diodes and LEDs are piecewise linear (off, or a knee voltage plus a
// series resistance); the NPN transistor is off, active (Ic = β·Ib) or saturated. The states are guessed, solved, checked
// and changed until they agree (usually 2–4 rounds). A tiny conductance (gmin) from every node to ground keeps parts that
// are connected to nothing from making the equations unsolvable.
//
// element types:
//   R   { a, b, r }                              resistor
//   V   { a(+), b(-), v, r }                     voltage source with internal resistance
//   D   { a(anode), b(cathode), vf, rs }         diode / LED
//   SW  { a, b, on }                             switch (on: 0.03 Ω)
//   Q   { c, b, e, beta, vbe, vsat }             NPN transistor
//   M   { a, b, r, emf }                         DC motor: resistance + back voltage
// solve() fills el.i (current a→b, or into the collector for Q) and returns node voltages.

const GMIN = 1e-9;

export function solve(nodeCount, els, prev) {
  const N = nodeCount; // unknowns: nodes 1..N-1
  if (N <= 1) { for (const e of els) { e.i = 0; if (e.type === 'Q') e.ib = 0; } return new Float64Array(Math.max(1, N)); }
  // starting guesses for the switching parts (last solution, if the circuit has not changed)
  for (const e of els) {
    if (e.type === 'D' && e.on === undefined) e.on = prev && prev.get(e) ? prev.get(e).on : false;
    if (e.type === 'Q' && e.st === undefined) e.st = prev && prev.get(e) ? prev.get(e).st : 0; // 0 off, 1 active, 2 saturated
  }
  const n = N - 1;
  const A = new Float64Array(n * n), z = new Float64Array(n);
  let V = new Float64Array(N);
  for (let iter = 0; iter < 40; iter++) {
    A.fill(0); z.fill(0);
    const G = (a, b, g) => { // conductance between a and b
      if (a) A[(a - 1) * n + a - 1] += g;
      if (b) A[(b - 1) * n + b - 1] += g;
      if (a && b) { A[(a - 1) * n + b - 1] -= g; A[(b - 1) * n + a - 1] -= g; }
    };
    const I = (a, b, i) => { // a current i flowing from a to b through the element
      if (a) z[a - 1] -= i;
      if (b) z[b - 1] += i;
    };
    const VCCS = (p, q, cp, cq, g) => { // current g·(V(cp)-V(cq)) flowing from p to q
      if (p && cp) A[(p - 1) * n + cp - 1] += g;
      if (p && cq) A[(p - 1) * n + cq - 1] -= g;
      if (q && cp) A[(q - 1) * n + cp - 1] -= g;
      if (q && cq) A[(q - 1) * n + cq - 1] += g;
    };
    for (let k = 1; k < N; k++) A[(k - 1) * n + k - 1] += GMIN;
    for (const e of els) {
      switch (e.type) {
        case 'R': G(e.a, e.b, 1 / Math.max(e.r, 1e-3)); break;
        case 'V': { const g = 1 / Math.max(e.r, 1e-3); G(e.a, e.b, g); I(e.b, e.a, e.v * g); break; }
        case 'SW': if (e.on) G(e.a, e.b, 1 / 0.03); break;
        case 'M': { const g = 1 / e.r; G(e.a, e.b, g); I(e.a, e.b, -e.emf * g); break; }
        case 'D': if (e.on) { const g = 1 / e.rs; G(e.a, e.b, g); I(e.a, e.b, -e.vf * g); } else G(e.a, e.b, 1e-9); break;
        case 'Q': {
          if (e.st === 0) { G(e.b, e.e, 1e-9); G(e.c, e.e, 1e-9); break; }
          const gb = 1 / 40; // base-emitter: a diode of 0.65 V + 40 Ω
          G(e.b, e.e, gb); I(e.b, e.e, -e.vbe * gb);
          if (e.st === 1) { VCCS(e.c, e.e, e.b, e.e, e.beta * gb); I(e.c, e.e, -e.beta * gb * e.vbe); G(e.c, e.e, 1e-7); }
          else { const gs = 1 / 0.4; G(e.c, e.e, gs); I(e.c, e.e, -e.vsat * gs); }
          break;
        }
      }
    }
    const x = gauss(A, z, n);
    if (!x) break;
    V = new Float64Array(N); for (let k = 1; k < N; k++) V[k] = x[k - 1];
    // check the guesses
    let changed = false;
    for (const e of els) {
      if (e.type === 'D') {
        const vd = V[e.a] - V[e.b];
        if (e.on) { const i = (vd - e.vf) / e.rs; if (i < -1e-9) { e.on = false; changed = true; } }
        else if (vd > e.vf + 1e-6) { e.on = true; changed = true; }
      } else if (e.type === 'Q') {
        const vbe = V[e.b] - V[e.e], vce = V[e.c] - V[e.e];
        const ib = e.st ? (vbe - e.vbe) / 40 : 0;
        if (e.st === 0) { if (vbe > e.vbe + 1e-6) { e.st = 1; changed = true; } }
        else if (ib < -1e-9) { e.st = 0; changed = true; }
        else if (e.st === 1 && vce < e.vsat) { e.st = 2; changed = true; }
        else if (e.st === 2) { const ic = (vce - e.vsat) / 0.4; if (ic > e.beta * ib + 1e-9) { e.st = 1; changed = true; } }
      }
    }
    if (!changed) break;
  }
  // currents
  for (const e of els) {
    const va = V[e.a] || 0, vb = V[e.b] || 0;
    switch (e.type) {
      case 'R': e.i = (va - vb) / Math.max(e.r, 1e-3); break;
      case 'V': e.i = (e.v - (va - vb)) / Math.max(e.r, 1e-3); break; // current out of the + terminal
      case 'SW': e.i = e.on ? (va - vb) / 0.03 : 0; break;
      case 'M': e.i = (va - vb - e.emf) / e.r; break;
      case 'D': e.i = e.on ? Math.max(0, (va - vb - e.vf) / e.rs) : 0; break;
      case 'Q': {
        const vbe = V[e.b] - V[e.e], vce = V[e.c] - V[e.e];
        e.ib = e.st ? Math.max(0, (vbe - e.vbe) / 40) : 0;
        e.i = e.st === 1 ? e.beta * e.ib : e.st === 2 ? Math.max(0, (vce - e.vsat) / 0.4) : 0;
        e.vce = vce; break;
      }
    }
  }
  return V;
}

// Gaussian elimination with partial pivoting (the circuits here have a few dozen nodes at most)
function gauss(A, b, n) {
  const M = A.slice(), x = b.slice();
  for (let c = 0; c < n; c++) {
    let p = c, best = Math.abs(M[c * n + c]);
    for (let r = c + 1; r < n; r++) { const v = Math.abs(M[r * n + c]); if (v > best) { best = v; p = r; } }
    if (best < 1e-18) return null;
    if (p !== c) { for (let k = 0; k < n; k++) { const t = M[c * n + k]; M[c * n + k] = M[p * n + k]; M[p * n + k] = t; } const t = x[c]; x[c] = x[p]; x[p] = t; }
    const d = M[c * n + c];
    for (let r = c + 1; r < n; r++) {
      const f = M[r * n + c] / d; if (!f) continue;
      for (let k = c; k < n; k++) M[r * n + k] -= f * M[c * n + k];
      x[r] -= f * x[c];
    }
  }
  for (let r = n - 1; r >= 0; r--) { let s = x[r]; for (let k = r + 1; k < n; k++) s -= M[r * n + k] * x[k]; x[r] = s / M[r * n + r]; }
  return x;
}

// which nodes have a real connection (through parts that conduct) to a source or ground: the others are "floating"
export function anchored(N, els) {
  const adj = Array.from({ length: N }, () => []);
  const link = (a, b) => { if (a === b) return; adj[a].push(b); adj[b].push(a); };
  const src = new Set([0]);
  for (const e of els) {
    switch (e.type) {
      case 'R': if (e.r < 5e7) link(e.a, e.b); break;
      case 'V': src.add(e.a); src.add(e.b); link(e.a, e.b); break;
      case 'SW': if (e.on) link(e.a, e.b); break;
      case 'M': link(e.a, e.b); break;
      case 'D': if (e.on) link(e.a, e.b); break;
      case 'Q': if (e.st) { link(e.b, e.e); link(e.c, e.e); } break;
    }
  }
  const ok = new Uint8Array(N); const q = [...src]; for (const s of q) ok[s] = 1;
  while (q.length) { const a = q.pop(); for (const b of adj[a]) if (!ok[b]) { ok[b] = 1; q.push(b); } }
  return ok;
}
