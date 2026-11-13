// Headset mode (Meta Quest and other standalone headsets): the same lab with less GPU work, for a steady 72 fps
// (Meta VRC.Quest.Performance.1). Turn it on or off for a test with ?lite=1 / ?lite=0.
//  - small "glow" lights of burners, bulbs and flames are left out: every extra light makes every lit surface in the
//    room more expensive, and adding one while the lab runs recompiles every material (a visible freeze)
//  - glass that uses transmission (an extra full render of the scene per eye) becomes plain see-through glass
//  - shadows use a cheaper filter and are redrawn every third frame
export const LITE = (() => {
  try { const q = new URLSearchParams(location.search).get('lite'); if (q != null) return q !== '0'; } catch (e) { /* no URL */ }
  return /OculusBrowser|Quest|Pico|Vive|Wolvic/i.test(navigator.userAgent || '');
})();
// a light that is never drawn: visible stays false whatever the experiment code sets
export function lockOff(L) {
  if (!L || L.userData.liteOff) return; L.userData.liteOff = true; L.castShadow = false;
  try { Object.defineProperty(L, 'visible', { get: () => false, set: () => {}, configurable: true }); } catch (e) { L.visible = false; }
}
// called for every piece of apparatus put on the bench
export function liteItem(root) {
  if (!LITE || !root) return;
  root.traverse((o) => {
    if ((o.isPointLight || o.isSpotLight) && !o.castShadow && o.distance > 0 && o.distance <= 1.5) lockOff(o);
    if (o.isMesh) for (const m of [].concat(o.material)) {
      if (m && m.transmission > 0) { m.transmission = 0; m.transparent = true; m.opacity = Math.min(m.opacity == null ? 1 : m.opacity, 0.5); m.depthWrite = false; m.needsUpdate = true; }
    }
  });
}
