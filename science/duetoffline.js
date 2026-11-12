// DUET STEM: shows how far the app has been saved for offline use, and keeps the saving going.
// The first time the app opens with internet it saves every file on the device (sw.js does the work);
// this card shows the progress until it is done, then says it now works without internet and goes away.
(() => {
  if (!('serviceWorker' in navigator) || /[?&](test|shot)\b/.test(location.search) || window.DUET_NATIVE) return;
  const SW = navigator.serviceWorker;
  let st = null, card = null, bar = null, l1 = null, l2 = null, hideT = 0, shownBusy = false;
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* not offered */ }
  const ping = () => { try { const c = SW.controller; if (c) c.postMessage({ type: 'sync' }); } catch (e) { /* none yet */ } };
  const mb = (b) => (b / 1e6).toFixed(b < 1e7 ? 1 : 0);

  function make() {
    card = document.createElement('div');
    card.setAttribute('role', 'status');
    card.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483000;width:min(440px,calc(100vw - 32px));'
      + 'background:rgba(14,18,28,.94);color:#eef1f6;border:1px solid rgba(240,163,74,.55);border-radius:14px;padding:12px 16px 14px;'
      + 'font:500 14px/1.35 "Noto Sans",system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45);pointer-events:none;transition:opacity .5s';
    l1 = document.createElement('div'); l1.style.cssText = 'font-weight:700;font-size:15px';
    l2 = document.createElement('div'); l2.style.cssText = 'opacity:.78;font-size:12.5px;margin-top:3px';
    const track = document.createElement('div'); track.style.cssText = 'height:6px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:9px;overflow:hidden';
    bar = document.createElement('div'); bar.style.cssText = 'height:100%;width:0;background:#f0a34a;border-radius:3px;transition:width .4s';
    track.appendChild(bar); card.append(l1, l2, track); document.body.appendChild(card);
  }
  function show(d) {
    st = d;
    if (d.ready) {
      if (!shownBusy) { if (card) card.remove(); card = null; return; } // already saved before: nothing to show
      if (!card) make();
      l1.textContent = 'Saved on this device: works without internet ✓'; l2.textContent = 'अब यह बिना इंटरनेट के चलेगा'; bar.style.width = '100%'; bar.style.background = '#52c27a';
      clearTimeout(hideT); hideT = setTimeout(() => { if (card) { card.style.opacity = '0'; setTimeout(() => { if (card) card.remove(); card = null; }, 600); } }, 4500);
      return;
    }
    shownBusy = true; if (!card) make();
    const k = d.bytesTotal ? Math.floor((d.bytes / d.bytesTotal) * 100) : 0;
    if (d.offline) {
      l1.textContent = `Saved ${k}% for offline use: connect to internet to finish`;
      l2.textContent = 'Wi-Fi पर इंटरनेट चालू करके ऐप एक बार खोलिए · the app still works online';
    } else {
      l1.textContent = `Saving for offline use… ${k}%`;
      l2.textContent = `${mb(d.bytes)} of ${mb(d.bytesTotal)} MB · keep Wi-Fi on · ऑफ़लाइन के लिए सेव हो रहा है`;
    }
    bar.style.width = k + '%';
  }
  SW.addEventListener('message', (e) => { const d = e.data || {}; if ((d.type === 'progress' || d.type === 'ready') && 'bytesTotal' in d) show(d); });
  SW.addEventListener('controllerchange', ping);
  SW.ready.then(() => { ping(); setInterval(() => { if (!st || !st.ready) ping(); }, 20000); }).catch(() => {});
  window.duetOffline = () => st;
})();
