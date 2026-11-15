// Real-looking hands and controllers in the headset: a soft white hand that follows your own fingers (hand tracking),
// or the real Quest Touch controller (models: WebXR Input Profiles, MIT licence, in lib/xr/).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const JOINTS = ['wrist', 'thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip',
  ...['index-finger', 'middle-finger', 'ring-finger', 'pinky-finger'].flatMap((f) => ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'].map((p) => `${f}-${p}`))];
const HAND_MAT = new THREE.MeshStandardMaterial({ color: 0xeef1f6, roughness: 0.4, metalness: 0, transparent: true, opacity: 0.9, emissive: 0x1a1d22 });
let GL = null; const load = (url, ok) => { (GL || (GL = new GLTFLoader())).load(url, ok, undefined, (e) => console.warn('xr model', url, e && e.message)); };

export function setupHands(renderer, scene) {
  const hs = [0, 1].map((i) => {
    const c = renderer.xr.getController(i), grip = renderer.xr.getControllerGrip(i), hand = renderer.xr.getHand(i);
    scene.add(hand);
    const h = { c, grip, hand, src: null, bones: [], handObj: null, padObj: null, handSide: '', padSide: '', stand: grip.children[0] || null };
    const attachHand = (side) => { if (h.handSide === side) return; h.handSide = side; if (h.handObj) { hand.remove(h.handObj); h.handObj = null; } h.bones = [];
      load(`lib/xr/hand-${side}.glb`, (g) => { if (h.handSide !== side) return; const o = g.scene.children[0] || g.scene;
        o.traverse((m) => { if (m.isSkinnedMesh || m.isMesh) { m.frustumCulled = false; m.material = HAND_MAT; m.renderOrder = 40; } });
        h.bones = JOINTS.map((n) => { const b = o.getObjectByName(n); if (b) b.jointName = n; return b; }).filter(Boolean); h.handObj = o; hand.add(o); }); };
    const attachPad = (side) => { if (h.padSide === side) return; h.padSide = side;
      load(`lib/xr/touch-${side}.glb`, (g) => { if (h.padSide !== side) return; if (h.padObj) grip.remove(h.padObj); h.padObj = g.scene; grip.add(h.padObj); if (h.stand) h.stand.visible = false; h.padObj.visible = !(h.src && h.src.hand); }); };
    c.addEventListener('connected', (e) => { h.src = e.data; const isHand = !!e.data.hand, side = e.data.handedness === 'left' ? 'left' : 'right';
      if (h.stand) h.stand.visible = !isHand && !h.padObj; if (h.padObj) h.padObj.visible = !isHand; if (h.handObj) h.handObj.visible = isHand;
      if (isHand) attachHand(side); else attachPad(side); });
    c.addEventListener('disconnected', () => { h.src = null; });
    return h;
  });
  return {
    hs,
    update() { for (const h of hs) { if (!h.src || !h.src.hand || !h.bones.length || !h.hand.joints) continue;
      for (const b of h.bones) { const J = h.hand.joints[b.jointName]; if (J && J.visible !== false) { b.position.copy(J.position); b.quaternion.copy(J.quaternion); } } } },
  };
}
