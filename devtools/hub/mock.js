// Test only: a stand-in for the Android hub's DuetNative download bridge, so the hub's download flow can be tried in a
// desktop browser. Same methods and events as HubBridge in the Android shell. Downloads are simulated from packs.json
// (sizes, shared files counted once), at `speed` bytes a second; `drop` makes the network go away once at 40 % and come
// back 1.5 s later (the download waits, then goes on where it was). State is kept in localStorage across pages.
// Injected with page.evaluateOnNewDocument(src, opts).
(function (opts) {
  opts = opts || {};
  const KEY = 'hubmock.v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } };
  const S = load() || { items: {}, have: {}, used: 0 };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* none */ } };
  let packs = null; const ready = fetch(new URL('/hub/packs.json', location.href)).then((r) => r.json()).then((j) => { packs = j; }).catch(() => {});
  const queue = []; let cur = null; const speed = opts.speed || 6e6; let dropped = false;
  const emit = (e) => setTimeout(() => { try { window.DuetHub && window.DuetHub.onEvent(JSON.stringify(e)); } catch (x) { /* page gone */ } }, 0);
  const filesOf = (id) => (packs && packs.items[id] ? packs.items[id].files : []);
  const sizeOf = (i) => packs.files[i][2];
  function pump() {
    if (cur || !queue.length || !packs) return;
    const id = queue.shift(); const need = filesOf(id).filter((i) => !S.have[i]); const total = need.reduce((t, i) => t + sizeOf(i), 0);
    cur = { id, done: 0, total, need, t: null, waiting: false };
    emit({ type: 'progress', id, done: 0, total });
    cur.t = setInterval(() => {
      if (!cur || cur.waiting) return;
      cur.done = Math.min(cur.total, cur.done + speed / 10);
      if (opts.drop && !dropped && cur.done > cur.total * 0.4) { dropped = true; cur.waiting = true; emit({ type: 'waiting', id, done: cur.done, total: cur.total }); setTimeout(() => { if (cur) { cur.waiting = false; emit({ type: 'progress', id, done: cur.done, total: cur.total }); } }, opts.dropMs || 1500); return; }
      emit({ type: 'progress', id, done: Math.round(cur.done), total: cur.total });
      if (cur.done >= cur.total) {
        clearInterval(cur.t); for (const i of cur.need) S.have[i] = 1; S.items[id] = 'ready'; S.used += cur.total; save();
        const fin = cur.id; cur = null; emit({ type: 'done', id: fin }); pump();
      }
    }, 100);
  }
  window.DuetNative = Object.assign(window.DuetNative || {}, {
    platform: () => 'android', version: () => '1.0.0 (mock)', vrMode: () => {}, deviceId: () => 'mockdevice00000000', deviceName: () => 'Mock phone', openChrome: () => {}, openExternal: () => {},
    hubList() {
      const active = []; if (cur) active.push({ id: cur.id, state: cur.waiting ? 'waiting' : 'downloading', done: Math.round(cur.done), total: cur.total });
      for (const id of queue) active.push({ id, state: 'queued', done: 0, total: 0 });
      return JSON.stringify({ items: S.items, active, used: S.used, free: (opts.free || 6.4e9) - S.used });
    },
    hubHas(id) { return !packs || !packs.items[id] ? 'unknown' : !packs.items[id].files.length || S.items[id] === 'ready' ? 'yes' : 'no'; },
    hubDownload(id) { if (S.items[id] === 'ready' || queue.includes(id) || (cur && cur.id === id)) return ''; queue.push(id); emit({ type: 'queued', id, done: 0, total: 0 }); ready.then(pump); return ''; },
    hubCancel(id) { const k = queue.indexOf(id); if (k >= 0) queue.splice(k, 1); if (cur && cur.id === id) { clearInterval(cur.t); cur = null; ready.then(pump); } emit({ type: 'cancelled', id }); },
    hubRemove(id) {
      if (!packs || !S.items[id]) return JSON.stringify({ freed: 0 });
      delete S.items[id]; const keep = new Set(); for (const o of Object.keys(S.items)) for (const i of filesOf(o)) keep.add(i);
      let freed = 0; for (const i of filesOf(id)) if (S.have[i] && !keep.has(i)) { delete S.have[i]; freed += sizeOf(i); }
      S.used -= freed; save(); return JSON.stringify({ freed });
    },
    hubRemoveAll() { const f = S.used; S.items = {}; S.have = {}; S.used = 0; save(); return JSON.stringify({ freed: f }); },
    hubFree() { return String((opts.free || 6.4e9) - S.used); },
  });
})
