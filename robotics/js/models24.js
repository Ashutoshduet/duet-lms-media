// DUET Robotics Lab 360, batch 24: the MCP3008 in its 16-pin DIP (parts24.js), from the package drawing: a black epoxy body
// 19.3 × 6.35 × 3.3 mm, 0.1" pin pitch, 0.3" between the rows, the notch and a pin-1 dot at the left end, the part number
// printed on top. Pin 1 is the anchor (row f); pins 1–8 run along +x, pins 16–9 sit 3 holes behind them (row e).
import * as THREE from 'three';
import { materials, box, shadows } from './models.js';
import * as TX from './tex.js';

const P = 2.54;
function topTexture() {
  const C = document.createElement('canvas'); C.width = 512; C.height = 168; const c = C.getContext('2d');
  c.fillStyle = '#17181b'; c.fillRect(0, 0, 512, 168);
  c.fillStyle = '#0b0b0d'; c.beginPath(); c.arc(0, 84, 30, -Math.PI / 2, Math.PI / 2); c.fill(); // the notch
  c.fillStyle = '#2a2b30'; c.beginPath(); c.arc(54, 128, 11, 0, Math.PI * 2); c.fill(); // the pin-1 dot (by pin 1, the row towards the student)
  c.fillStyle = '#d9d9d2'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `700 46px ${TX.FONT}`; c.fillText('MCP3008', 280, 66); c.font = `500 26px ${TX.FONT}`; c.fillStyle = '#a9a9a2'; c.fillText('I/P  2347', 280, 116);
  const t = new THREE.CanvasTexture(C); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let TOP = null;
export function buildMCP3008() {
  const M = materials(); const g = new THREE.Group();
  const cx = 3.5 * P, cz = -1.5 * P, L = 19.3, W = 6.35, H = 3.3, y0 = 0.6;
  for (let k = 0; k < 8; k++) for (const z of [0, -3 * P]) { // each leg: down into its hole, and the shoulder out to the body
    g.add(box(0.5, 4.2, 0.28, M.tin, k * P, -1.2, z));
    g.add(box(0.5, 0.28, 1.0, M.tin, k * P, y0 + 1.0, z + (z === 0 ? -0.5 : 0.5)));
  }
  if (!TOP) TOP = new THREE.MeshStandardMaterial({ map: topTexture(), roughness: 0.6 });
  const body = new THREE.MeshStandardMaterial({ color: 0x17181b, roughness: 0.6 });
  g.add(box(L, H, W, [body, body, TOP, body, body, body], cx, y0 + H / 2, cz));
  shadows(g, true, false); return g;
}
export function buildPart24(part) { return part.type === 'mcp3008' ? buildMCP3008() : null; }
