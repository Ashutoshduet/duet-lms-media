// DUET Robotics Lab 360, batch 7: what the projects switch, shown on the bench itself (the batch-3 lessons had a whole room
// beside the bench; these bench projects show the result where the student is looking). Our own work, modelled in code:
//   load230 { show: true }   the closed 230 V box with what it feeds on top: a bulb in a batten holder that glows (lamp),
//                            or a small ceiling fan whose blades turn (fan); the box's state (b, a) drives them
//   pump { mount: 'bottle' } the mini pump's plug, and a sanitizer bottle with the pump inside, a nozzle, and a stream of
//                            liquid while it flows
// Moving or glowing pieces are kept (userData.keep); userData.update(part) animates them (view.js calls it).
import * as THREE from 'three';
import { box, cyl, shadows } from './models.js';
import { buildMainsBox, MAT3 } from './models3.js';
import { buildPlug } from './models2.js';

const P = 2.54;
const S = (o) => new THREE.MeshStandardMaterial(o);
const keep = (o) => { o.userData.keep = true; return o; };
let M7 = null;
function mats() {
  if (M7) return M7;
  M7 = { holder: S({ color: 0xf2efe6, roughness: 0.5 }), brass: S({ color: 0xd8b25a, metalness: 1, roughness: 0.35 }), rod: S({ color: 0xdedcd6, metalness: 0.6, roughness: 0.4 }),
    blade: S({ color: 0x8a6a48, roughness: 0.6 }), hub: S({ color: 0xe8e6e0, metalness: 0.3, roughness: 0.4 }), cap: S({ color: 0x2a7a3a, roughness: 0.45 }), pumpBody: S({ color: 0x1b1b1d, roughness: 0.5 }) };
  for (const m of Object.values(M7)) m.userData.shared = true;
  return M7;
}

// the 230 V box with its bulb or fan on the lid (the box's centre is at (P, 0, -32), its lid 28 mm up)
function mainsWithLoad(kind) {
  const g = buildMainsBox(kind); const M = mats(); const top = new THREE.Group(); top.position.set(P, 28, -32); g.add(top);
  if (kind === 'fan') {
    top.add(cyl(1.4, 16, M.rod, 0, 8, 0, 10)); top.add(cyl(5.5, 5, M.hub, 0, 18, 0, 18));
    const rot = keep(new THREE.Group()); rot.position.set(0, 18, 0); top.add(rot);
    for (let i = 0; i < 3; i++) { const b = box(30, 0.9, 7, M.blade, 19, 0, 0); const arm = new THREE.Group(); arm.rotation.y = i * Math.PI * 2 / 3; b.rotation.x = 0.12; arm.add(b); rot.add(arm); }
    g.userData.update = (p) => { const a = p.state.a || 0; if (Math.abs(rot.rotation.y - a) < 1e-4) return false; rot.rotation.y = a; return (p.state.w || 0) > 0.01; };
  } else {
    top.add(cyl(6, 5, M.holder, 0, 2.5, 0, 18)); top.add(cyl(4.2, 6, M.brass, 0, 8, 0, 16));
    const glass = keep(new THREE.Mesh(new THREE.SphereGeometry(10, 24, 16), S({ color: 0xfaf6ea, emissive: 0xffc860, emissiveIntensity: 0, roughness: 0.25, transparent: true, opacity: 0.92 })));
    glass.position.set(0, 19.5, 0); glass.scale.set(1, 1.15, 1); top.add(glass);
    g.userData.update = (p) => { const v = Math.max(0, Math.min(1, p.state.b || 0)) * 2.6; if (Math.abs(glass.material.emissiveIntensity - v) < 0.01) return false; glass.material.emissiveIntensity = v; return true; };
  }
  shadows(g); return g;
}

// the sanitizer bottle behind the pump's plug: translucent body, green pump head and nozzle, the pump inside
function pumpBottle() {
  const g = buildPlug(['#c8281c', '#1b1b1d']); const M = mats(); void MAT3;
  const b = new THREE.Group(); b.position.set(-P, 0, -46); g.add(b);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(15, 16, 56, 28), new THREE.MeshPhysicalMaterial({ color: 0xbfe6f2, roughness: 0.12, transparent: true, opacity: 0.45, depthWrite: false }));
  body.position.y = 28; b.add(keep(body));
  const gel = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 38, 24), S({ color: 0x8fd8ff, roughness: 0.2, transparent: true, opacity: 0.5, depthWrite: false })); gel.position.y = 19.5; b.add(keep(gel));
  b.add(cyl(5, 9, M.pumpBody, 0, 6, 0, 16));
  b.add(cyl(9, 7, M.cap, 0, 59.5, 0, 20)); b.add(cyl(2.4, 12, M.cap, 0, 69, 0, 12));
  const noz = box(5, 4, 20, M.cap, 0, 74, 10); b.add(noz);
  const stream = keep(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.8, 70, 8), S({ color: 0x9fe0ff, roughness: 0.1, transparent: true, opacity: 0, depthWrite: false })));
  stream.position.set(0, 37, 19); b.add(stream);
  g.userData.update = (p) => { const o = Math.max(0, Math.min(0.8, (p.state.flow || 0) / 25)); if (Math.abs(stream.material.opacity - o) < 0.01) return false; stream.material.opacity = o; stream.visible = o > 0.02; return true; };
  shadows(g); return g;
}

export function buildPart7(part) {
  if (part.type === 'load230' && part.props && part.props.show) return mainsWithLoad(part.props.kind);
  if (part.type === 'pump' && part.props && part.props.mount === 'bottle') return pumpBottle();
  return null;
}
