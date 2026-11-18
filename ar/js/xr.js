// DUET AR on Meta Quest (and other WebXR headsets): the Quest browser gives web pages no camera, so the cards cannot be
// scanned there. Instead the student chooses the card's name and the same model stands on the real table, in mixed reality
// (passthrough): a ring shows where the controller or hand points on the table (WebXR hit-test); pull the trigger or pinch
// to put the model there. Then: point at a part and pull/pinch to hear its name; the buttons beside the model turn it,
// take it apart, read it aloud, make it bigger or smaller, and end. The thumbstick turns (left-right) and resizes (up-down);
// holding the grip carries the model. If the headset finds no surface (no room set-up), the model is put in front of you.
//
//   import { startMR } from './xr.js';  await startMR(catalogItem, { lang: 'en', onEnd });
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadItem } from './models.js';
import { tintAnatomy } from './anatomy.js';   // (loaded by models.js too; kept for clarity)
import { partFor, itemSay, Narrator, loadInfo } from './info.js';
import { pick } from './i18n.js';
void tintAnatomy;

const W = {
  place: { en: 'Point at your table, then pull the trigger or pinch to put it there.', hi: 'अपनी मेज़ की ओर इशारा करें, फिर ट्रिगर दबाएँ या चुटकी बनाएँ।', hg: 'Apni table ki taraf point karo, phir trigger dabao ya pinch karo.' },
  noSurface: { en: 'No table found: pull the trigger or pinch to put it in front of you.', hi: 'मेज़ नहीं मिली: सामने रखने के लिए ट्रिगर दबाएँ या चुटकी बनाएँ।', hg: 'Table nahi mili: saamne rakhne ke liye trigger dabao ya pinch karo.' },
  placed: { en: 'Point at a part and pull the trigger (or pinch) to hear its name.', hi: 'किसी हिस्से की ओर इशारा करके ट्रिगर दबाएँ (या चुटकी), उसका नाम सुनें।', hg: 'Kisi part ki taraf point karke trigger dabao (ya pinch), uska naam suno.' },
};
const BTN = [
  ['turn', '↻', { en: 'Turn', hi: 'घुमाएँ', hg: 'Ghumao' }],
  ['apart', '⇱', { en: 'Take apart', hi: 'अलग करें', hg: 'Alag karo' }],
  ['say', '♪', { en: 'Listen', hi: 'सुनें', hg: 'Suno' }],
  ['bigger', '+', { en: 'Bigger', hi: 'बड़ा', hg: 'Bada' }],
  ['smaller', '−', { en: 'Smaller', hi: 'छोटा', hg: 'Chhota' }],
  ['move', '✥', { en: 'Move', hi: 'हटाएँ', hg: 'Hatao' }],
  ['exit', '✕', { en: 'End', hi: 'बंद', hg: 'Band' }],
];

function panel(w, h, draw) {   // a flat label in the room (canvas texture)
  const cv = document.createElement('canvas'); cv.width = Math.round(w * 1600); cv.height = Math.round(h * 1600);
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
  m.userData.redraw = (...a) => { const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); draw(g, cv.width, cv.height, ...a); tx.needsUpdate = true; };
  m.renderOrder = 10; return m;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const FONT = '"Noto Sans Devanagari", system-ui, sans-serif';
function wrap(g, text, maxW) { const out = []; let line = ''; for (const w of String(text || '').split(/\s+/)) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }

export async function isMRSupported() {
  try { return !!(navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')); } catch (e) { return false; }
}

export async function startMR(item, o = {}) {
  const lang = o.lang || 'en';
  // the session first, while the tap that asked for it still counts (a browser allows it only right after a tap)
  const session = await navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor'], optionalFeatures: ['hit-test', 'plane-detection', 'anchors', 'hand-tracking'] });
  // our own canvas and renderer, so the page's viewer is left as it was
  const canvas = document.createElement('canvas'); canvas.className = 'duet-mr'; Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '50' });
  document.body.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(1); renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.setClearColor(0x000000, 0);
  renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor');
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(70, 1, 0.02, 50);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-1, 3, 1); scene.add(key, new THREE.HemisphereLight(0xdfe8ff, 0x2a2018, 0.5));
  await renderer.xr.setSession(session);
  let ended = false; session.addEventListener('end', () => { ended = true; }, { once: true });
  // while the model loads: a ring of light in front of the student
  const wait = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 8, 48), new THREE.MeshBasicMaterial({ color: 0xf26b1d }));
  wait.position.set(0, 1.3, -0.8); scene.add(wait); renderer.setAnimationLoop(() => { wait.rotation.z += 0.08; renderer.render(scene, camera); });
  await loadInfo();

  let model;
  try { model = await loadItem(item, { base: location.href, renderer }); } catch (e) { session.end(); throw e; }
  scene.remove(wait); if (ended) { renderer.setAnimationLoop(null); renderer.dispose(); canvas.remove(); if (o.onEnd) o.onEnd(); return; }
  // the model on a table: about 25 cm across, at most 30 cm high, standing on its base
  const holder = new THREE.Group(), turn = new THREE.Group(), fit = new THREE.Group(); holder.add(turn); turn.add(fit); fit.add(model.root);
  const box = new THREE.Box3().setFromObject(model.root, true), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const s = Math.min(0.25 / (Math.hypot(size.x, size.z) || 1), 0.3 / (size.y || 1)) * (item.scale || 1), lift = (item.float || 0) * size.y * s;
  fit.scale.setScalar(s); fit.position.set(-c.x * s, -box.min.y * s + lift, -c.z * s);
  if (item.yaw) turn.rotation.y = THREE.MathUtils.degToRad(item.yaw);
  holder.visible = false; scene.add(holder);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(Math.max(size.x, size.z) * s * 0.6, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.002; holder.add(shadow);
  let mixer = null; if (model.clips.length) { mixer = new THREE.AnimationMixer(model.root); mixer.clipAction(model.clips[0]).play(); }
  const spinT = model.root.userData.spinTarget || (model.root.children[0] && model.root.children[0].userData.spinTarget);
  // take apart: every part moves out from the middle (as modes.js does)
  const parts = []; { const list = []; model.root.traverse((m) => { if (m.isMesh) list.push(m); }); if (list.length >= 3) { model.root.updateMatrixWorld(true); const mid = c.clone(), sz = size.length() || 1; for (const m of list) { const b = new THREE.Box3().setFromObject(m, true); if (b.isEmpty()) continue; const d = b.getCenter(new THREE.Vector3()).sub(mid); const far = d.length() / sz; if (d.lengthSq() < 1e-12) d.set(0, 1, 0); const inv = new THREE.Matrix4().copy(m.parent.matrixWorld).invert(), lin = new THREE.Matrix3().setFromMatrix4(inv), dl = d.normalize().applyMatrix3(lin).normalize(); const sc = new THREE.Vector3().setFromMatrixScale(m.parent.matrixWorld).x || 1; parts.push({ m, base: m.position.clone(), d: dl.multiplyScalar((0.18 + 0.55 * far) * sz / sc) }); } } }
  let apart = 0, apartTo = 0;

  // the reticle (where a placement would go), the hint, the buttons and the part label
  const reticle = new THREE.Mesh(new THREE.RingGeometry(0.045, 0.06, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf26b1d, transparent: true, opacity: 0.9 }));
  reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);
  const hint = panel(0.5, 0.11, (g, w, h, text) => { rr(g, 4, 4, w - 8, h - 8, 26); g.fillStyle = 'rgba(10,13,18,0.86)'; g.fill(); g.strokeStyle = '#f26b1d'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#fff'; g.font = `600 ${h * 0.24}px ${FONT}`; const ls = wrap(g, text, w - 60).slice(0, 3); ls.forEach((l, i) => g.fillText(l, 30, h * 0.36 + i * h * 0.27)); });
  hint.userData.redraw(pick(W.place, lang)); scene.add(hint);
  const label = panel(0.34, 0.12, (g, w, h, a, b) => { rr(g, 4, 4, w - 8, h - 8, 24); g.fillStyle = 'rgba(10,13,18,0.9)'; g.fill(); g.strokeStyle = '#f26b1d'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#ffb27a'; g.font = `700 ${h * 0.2}px ${FONT}`; g.fillText(a, 26, h * 0.3); g.fillStyle = '#c9d0da'; g.font = `400 ${h * 0.14}px ${FONT}`; wrap(g, b, w - 52).slice(0, 4).forEach((l, i) => g.fillText(l, 26, h * 0.52 + i * h * 0.16)); });
  label.visible = false; scene.add(label);
  const bar = new THREE.Group(); bar.visible = false; scene.add(bar); const buttons = [];
  BTN.forEach(([id, glyph, name], i) => {
    const b = panel(0.07, 0.07, (g, w, h, on) => { rr(g, 6, 6, w - 12, h - 12, 22); g.fillStyle = on ? '#f26b1d' : 'rgba(14,18,25,0.88)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 4; g.stroke(); g.fillStyle = on ? '#1a0d04' : '#fff'; g.textAlign = 'center'; g.font = `700 ${h * 0.42}px ${FONT}`; g.fillText(glyph, w / 2, h * 0.56); g.font = `600 ${h * 0.13}px ${FONT}`; g.fillText(pick(name, lang), w / 2, h * 0.84); });
    b.userData.redraw(false); b.position.set((i - (BTN.length - 1) / 2) * 0.078, 0, 0); b.userData.btn = id; bar.add(b); buttons.push(b);
  });
  const narr = new Narrator();


  let refSpace = null, viewerSpace = null, hitSources = new Map(), placed = false, noHitSince = performance.now(), lastHit = null, spinning = false, moving = false;
  session.requestReferenceSpace('local-floor').then((r) => { refSpace = r; }).catch(() => {});
  session.requestReferenceSpace('viewer').then((v) => { viewerSpace = v; if (session.requestHitTestSource) session.requestHitTestSource({ space: v }).then((h) => hitSources.set('viewer', h)).catch(() => {}); }).catch(() => {});
  const addSource = (src) => { if (!session.requestHitTestSource || hitSources.has(src)) return; session.requestHitTestSource({ space: src.targetRaySpace }).then((h) => hitSources.set(src, h)).catch(() => {}); };
  session.addEventListener('inputsourceschange', (e) => { for (const s2 of e.added) addSource(s2); for (const s2 of e.removed) { const h = hitSources.get(s2); if (h) h.cancel(); hitSources.delete(s2); } });
  for (const s2 of session.inputSources) addSource(s2);

  // input straight from the session (works the same for controllers and hands, and before or after they appear):
  // each frame the aiming ray of every input source, a thin line along it
  const rays = new Map(), lines = new Map(), rc = new THREE.Raycaster();
  const lineFor = (src) => { if (!lines.has(src)) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -1)]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })); l.matrixAutoUpdate = false; l.scale.z = 0.6; scene.add(l); lines.set(src, l); } return lines.get(src); };
  const aim = (src) => {
    const r = rays.get(src);
    if (r) { rc.ray.origin.copy(r.o); rc.ray.direction.copy(r.d); }
    else { const xrCam = renderer.xr.getCamera(); rc.ray.origin.setFromMatrixPosition(xrCam.matrixWorld); rc.ray.direction.set(0, 0, -1).applyQuaternion(xrCam.quaternion); }   // gaze
    return rc;
  };
  const placeAt = (pos, faceTo) => {
    holder.position.copy(pos); holder.visible = true; placed = true; reticle.visible = false;
    const v = new THREE.Vector3().subVectors(faceTo, pos); holder.rotation.set(0, Math.atan2(v.x, v.z), 0);   // the model faces the student
    bar.visible = true; hint.userData.redraw(pick(W.placed, lang));
  };
  const head = () => { const xrCam = renderer.xr.getCamera(); return new THREE.Vector3().setFromMatrixPosition(xrCam.matrixWorld); };
  const onSelect = (e) => {
    const ctrl = e.inputSource;
    if (!placed || moving) {
      if (lastHit) placeAt(lastHit, head());
      else { const r2 = aim(ctrl), p = r2.ray.origin.clone().addScaledVector(r2.ray.direction, 0.55); p.y = Math.min(p.y, head().y - 0.45); placeAt(p, head()); }   // no surface: in front of you
      moving = false; return;
    }
    const r2 = aim(ctrl);
    const hb = r2.intersectObjects(buttons, false)[0];
    if (hb) { press(hb.object.userData.btn, hb.object); return; }
    const hm = r2.intersectObject(model.root, true).filter((h) => !(h.object.material && h.object.material.opacity < 0.15))[0];
    if (hm) {
      const part = partFor(item, hm.object, lang);
      const t1 = part ? part.name : pick(item.name, lang), t2 = part ? part.text : pick(item.about, lang);
      label.userData.redraw(t1, t2); label.visible = true; hint.visible = false; label.position.copy(hm.point).add(new THREE.Vector3(0, 0.1, 0)); label.lookAt(head());
      if (part) narr.say(part.clip, t1 + '. ' + t2, lang); else { const sy = itemSay(item, lang); narr.say(sy.clip, sy.text, lang); }
    } else if (lastHit) placeAt(lastHit, head());   // pointing at the table: the model goes there
  };
  const press = (id, b) => {
    if (id === 'turn') { spinning = !spinning; b.userData.redraw(spinning); }
    else if (id === 'apart') { apartTo = apartTo ? 0 : 1; b.userData.redraw(!!apartTo); }
    else if (id === 'say') { if (narr.playing) narr.stop(); else { const sy = itemSay(item, lang); narr.say(sy.clip, sy.text, lang); } }
    else if (id === 'bigger') holder.scale.multiplyScalar(1.25);
    else if (id === 'smaller') holder.scale.multiplyScalar(0.8);
    else if (id === 'move') { moving = true; hint.userData.redraw(pick(W.place, lang)); }
    else if (id === 'exit') session.end();
  };
  let grab = null;
  session.addEventListener('select', onSelect);
  session.addEventListener('squeezestart', (e) => { const r = rays.get(e.inputSource); if (placed && r) grab = { src: e.inputSource, off: new THREE.Vector3().subVectors(holder.position, r.o) }; });
  session.addEventListener('squeezeend', (e) => { if (grab && grab.src === e.inputSource) grab = null; });

  let last = performance.now();
  let frames = 0;
  renderer.setAnimationLoop((time, frame) => {
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now; frames++;
    if (frame && refSpace) for (const src of session.inputSources) {
      const p = frame.getPose(src.targetRaySpace, refSpace); const l = lineFor(src); l.visible = !!p; if (!p) continue;
      const m = new THREE.Matrix4().fromArray(p.transform.matrix); l.matrix.copy(m).scale(new THREE.Vector3(1, 1, 0.6));
      rays.set(src, { o: new THREE.Vector3().setFromMatrixPosition(m), d: new THREE.Vector3(0, 0, -1).transformDirection(m) });
    }
    if (frame && refSpace && (!placed || moving)) {
      // where the controllers (or, with none, the head) point on a real surface
      let hitPose = null;
      for (const [src, hs] of hitSources) { if (src === 'viewer' && hitSources.size > 1) continue; const r = frame.getHitTestResults(hs); if (r.length) { hitPose = r[0].getPose(refSpace); if (hitPose) break; } }
      if (hitPose) { reticle.visible = true; reticle.matrix.fromArray(hitPose.transform.matrix); lastHit = new THREE.Vector3().setFromMatrixPosition(reticle.matrix); noHitSince = now; }
      else { reticle.visible = false; lastHit = null; if (now - noHitSince > 2500) hint.userData.redraw(pick(W.noSurface, lang)), noHitSince = now - 1e6; }
    }
    // the hint floats in front of the student, a little low
    const hp = head(), xrCam = renderer.xr.getCamera(), fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(xrCam.quaternion); fwd.y = 0; if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1); fwd.normalize();
    const want = hp.clone().addScaledVector(fwd, 0.7); want.y -= 0.25; hint.position.lerp(want, placed ? 0.05 : 0.2); hint.lookAt(hp);
    if (placed) {
      bar.position.copy(holder.position).add(new THREE.Vector3(0, -0.002, 0)).addScaledVector(new THREE.Vector3().subVectors(hp, holder.position).setY(0).normalize(), Math.max(0.16, 0.6 * size.x * s * holder.scale.x + 0.08)); bar.position.y = holder.position.y + 0.03; bar.lookAt(hp.x, bar.position.y + 0.15, hp.z);
      // thumbsticks: left-right turns, up-down resizes
      for (const src of session.inputSources) { const gp = src.gamepad; if (!gp || gp.axes.length < 4) continue; const x = gp.axes[2], y = gp.axes[3]; if (Math.abs(x) > 0.2) turn.rotation.y -= x * dt * 2; if (Math.abs(y) > 0.2) holder.scale.multiplyScalar(Math.pow(1.6, -y * dt)); }
      if (grab && rays.get(grab.src)) holder.position.copy(rays.get(grab.src).o).add(grab.off);
      if (spinning) turn.rotation.y += dt * 0.6;
      if (apart !== apartTo) { apart = THREE.MathUtils.clamp(apart + Math.sign(apartTo - apart) * dt * 1.8, 0, 1); const e = apart * apart * (3 - 2 * apart); for (const p of parts) p.m.position.copy(p.base).addScaledVector(p.d, e); }
      if (mixer) mixer.update(dt); if (spinT) spinT.rotation.y += dt * 0.3;
    }
    renderer.render(scene, camera);
  });
  window.__mr = { session, scene, holder, press, placeAt, get placed() { return placed; }, get frames() { return frames; }, get sources() { return session.inputSources.length; }, item };
  if (!ended) await new Promise((res) => session.addEventListener('end', res, { once: true }));
  renderer.setAnimationLoop(null); narr.stop();
  for (const h of hitSources.values()) { try { h.cancel(); } catch (e) { /* gone */ } }
  renderer.dispose(); canvas.remove(); window.__mr = null;
  if (o.onEnd) o.onEnd();
}
