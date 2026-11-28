// DUET STEM 360: what is on this device. Inside the Android app the DuetNative bridge downloads an activity's files in
// the background (checked by size and hash, resumed after the network drops) and tells the page how far it got through
// window.DuetHub.onEvent(). On the website there is nothing to download: every activity plays online.
//
// Bridge (Android hub only):
//   DuetNative.hubList()        -> JSON {items: {id: 'ready'|'stale'|'partial'}, active: [{id, state, done, total}], used, free}
//   DuetNative.hubDownload(id)  -> '' (queued; events follow)       DuetNative.hubCancel(id)
//   DuetNative.hubRemove(id)    -> JSON {freed}                       DuetNative.hubRemoveAll() -> JSON {freed}
//   events: {type: 'queued'|'progress'|'waiting'|'done'|'error'|'cancelled'|'removed', id, done, total, msg}
export function makeStore(packs, onChange) {
  const N = window.DuetNative;
  const native = !!(N && typeof N.hubList === 'function');
  const S = { native, items: {}, active: {}, used: 0, free: 0, err: {}, have: new Set() };
  const files = packs ? packs.items : {};
  const size = (i) => (packs ? packs.files[i][2] : 0);
  function rebuildHave() {
    S.have = new Set();
    for (const [id, st] of Object.entries(S.items)) if (st === 'ready' || st === 'stale') for (const i of (files[id] || { files: [] }).files) S.have.add(i);
  }
  function refresh() {
    if (!native) return;
    try {
      const j = JSON.parse(N.hubList() || '{}');
      S.items = j.items || {}; S.used = +j.used || 0; S.free = +j.free || 0;
      S.active = {}; for (const a of j.active || []) S.active[a.id] = a;
      rebuildHave();
    } catch (e) { /* keep the last state */ }
  }
  window.DuetHub = { onEvent(e) {
    if (typeof e === 'string') { try { e = JSON.parse(e); } catch (x) { return; } }
    if (!e || !e.id) { refresh(); onChange && onChange(e || {}); return; }
    const a = S.active[e.id] || (S.active[e.id] = { id: e.id, done: 0, total: 0 });
    if (e.type === 'progress' || e.type === 'queued' || e.type === 'waiting') { a.state = e.type === 'progress' ? 'downloading' : e.type; if (e.total != null) { a.done = e.done || 0; a.total = e.total; } delete S.err[e.id]; }
    else { delete S.active[e.id]; if (e.type === 'error') S.err[e.id] = e.msg || 'failed'; if (e.type === 'done' || e.type === 'removed' || e.type === 'error' || e.type === 'cancelled') refresh(); }
    onChange && onChange(e);
  } };
  refresh();
  return {
    native,
    get used() { return S.used; }, get free() { return S.free; },
    // 'inapp' (no extra files), 'ready', 'stale', 'downloading', 'queued', 'waiting', 'error', 'none'; 'online' on the website
    state(id) {
      const p = files[id];
      if (!native) return 'online';
      if (!p || !p.files.length) return 'inapp';
      const a = S.active[id]; if (a) return a.state || 'queued';
      if (S.err[id]) return 'error';
      return S.items[id] === 'ready' ? 'ready' : S.items[id] === 'stale' ? 'stale' : 'none';
    },
    progress(id) { const a = S.active[id]; return a ? { done: a.done || 0, total: a.total || 0 } : null; },
    error(id) { return S.err[id] || null; },
    // bytes still to fetch for these items (a file already on the device, or shared by two of them, counts once)
    need(ids) { const seen = new Set(); let b = 0; for (const id of ids) for (const i of (files[id] || { files: [] }).files) if (!S.have.has(i) && !seen.has(i)) { seen.add(i); b += size(i); } return b; },
    bytes(id) { return (files[id] || { bytes: 0 }).bytes; },
    downloaded() { return Object.keys(S.items).filter((id) => S.items[id] === 'ready' || S.items[id] === 'stale'); },
    activeIds() { return Object.keys(S.active); },
    download(id) { if (!native) return; delete S.err[id]; S.active[id] = S.active[id] || { id, state: 'queued', done: 0, total: 0 }; try { N.hubDownload(id); } catch (e) { S.err[id] = String(e); delete S.active[id]; } },
    cancel(id) { if (native) try { N.hubCancel(id); } catch (e) { /* gone */ } },
    remove(id) { if (!native) return 0; try { const r = JSON.parse(N.hubRemove(id) || '{}'); refresh(); return +r.freed || 0; } catch (e) { refresh(); return 0; } },
    removeAll() { if (!native) return 0; try { const r = JSON.parse(N.hubRemoveAll() || '{}'); refresh(); return +r.freed || 0; } catch (e) { refresh(); return 0; } },
    refresh,
  };
}
