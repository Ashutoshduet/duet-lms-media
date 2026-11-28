// DUET STEM 360: moving around with a TV remote, a keyboard or a Bluetooth controller's D-pad. The arrow keys move the
// focus to the nearest button in that direction (on the top layer only: a dialog, the detail page or the main page);
// OK / Enter presses it; Back / Escape goes back.
const SEL = 'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])';
function layer() {
  const ask = document.getElementById('ask'); if (ask && !ask.hidden) return ask;
  const d = document.getElementById('detail'); if (d && !d.hidden) return d;
  return document.getElementById('app');
}
function visible(el) {
  if (el.closest('[hidden]')) return false;
  const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) return false;
  const s = getComputedStyle(el); return s.visibility !== 'hidden' && s.display !== 'none';
}
function clipRect(el) { // the part of the screen a scrolling strip shows (cards outside it can still be reached)
  return el.getBoundingClientRect();
}
export function move(dir) {
  const root = layer(); const cur = document.activeElement && root.contains(document.activeElement) && document.activeElement !== root ? document.activeElement : null;
  const all = [...root.querySelectorAll(SEL)].filter(visible);
  if (!cur) { const first = all.find((e) => e.closest('main, #detail .dwrap, #ask')) || all[0]; if (first) focus(first); return true; }
  const c = clipRect(cur); const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
  let best = null, bs = Infinity;
  for (const el of all) {
    if (el === cur) continue;
    const r = clipRect(el); const x = r.left + r.width / 2, y = r.top + r.height / 2;
    let d, o;
    if (dir === 'right') { if (r.left < c.right - 4 && x <= cx + 4) continue; d = Math.max(0, r.left - c.right); o = Math.abs(y - cy) - (r.height + c.height) / 2; }
    else if (dir === 'left') { if (r.right > c.left + 4 && x >= cx - 4) continue; d = Math.max(0, c.left - r.right); o = Math.abs(y - cy) - (r.height + c.height) / 2; }
    else if (dir === 'down') { if (r.top < c.bottom - 4 && y <= cy + 4) continue; d = Math.max(0, r.top - c.bottom); o = Math.abs(x - cx) - (r.width + c.width) / 2; }
    else { if (r.bottom > c.top + 4 && y >= cy - 4) continue; d = Math.max(0, c.top - r.bottom); o = Math.abs(x - cx) - (r.width + c.width) / 2; }
    const s = d + Math.max(0, o) * 3 + (o > 0 ? 40 : 0);
    if (s < bs) { bs = s; best = el; }
  }
  if (best) { focus(best); return true; }
  return false;
}
function focus(el) {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
const DIRS = { ArrowRight: 'right', ArrowLeft: 'left', ArrowDown: 'down', ArrowUp: 'up' };
export function initNav(onBack) {
  addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
    const dir = DIRS[e.key];
    if (dir) {
      if (typing && (dir === 'left' || dir === 'right')) return; // the cursor in the search box
      if (move(dir)) e.preventDefault();
      return;
    }
    if (e.key === 'Escape' || e.key === 'GoBack' || e.key === 'BrowserBack' || (e.key === 'Backspace' && !typing)) { if (onBack()) e.preventDefault(); }
  });
  // a Bluetooth controller (gamepad): D-pad moves, A presses, B goes back
  let prev = []; const poll = () => {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    for (const g of pads) {
      const b = g.buttons.map((x) => x && x.pressed); const was = prev[g.index] || [];
      const hit = (i) => b[i] && !was[i];
      if (hit(12)) move('up'); if (hit(13)) move('down'); if (hit(14)) move('left'); if (hit(15)) move('right');
      if (hit(0) && document.activeElement && document.activeElement.click) document.activeElement.click();
      if (hit(1)) onBack();
      prev[g.index] = b;
    }
    if (pads.length) requestAnimationFrame(poll); else running = false;
  };
  let running = false;
  addEventListener('gamepadconnected', () => { if (!running) { running = true; requestAnimationFrame(poll); } });
}
