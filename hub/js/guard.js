// DUET STEM 360, Android hub only: the hub app adds this script to each activity page it serves (the apps' own files are
// unchanged). When the student picks another activity from the app's own menu and its files are not on the phone yet,
// the hub's download prompt opens instead of a half-loaded scene. On the website this script is never loaded.
(() => {
  const N = window.DuetNative;
  if (!N || typeof N.hubHas !== 'function' || window.__duetHubGuard) return;
  window.__duetHubGuard = true;
  const app = location.pathname.split('/')[2] || '';
  const has = (id) => { try { return N.hubHas(id); } catch (e) { return 'unknown'; } };
  const need = (id) => { location.href = '/app/hub/index.html#need/' + encodeURIComponent(id); };
  // the catalogue id of an activity the app is asked to open (the first of the guesses that is a catalogue item)
  const item = (...ids) => ids.find((id) => has(id) !== 'unknown');
  const wrap = (a, name, ids) => {
    const f = a[name]; if (typeof f !== 'function' || f.__hub) return;
    const g = function (id, ...rest) { const it = id != null && item(...ids(String(id))); if (it && has(it) === 'no') { need(it); return undefined; } return f.call(this, id, ...rest); };
    g.__hub = true; a[name] = g;
  };
  function guard(a) {
    wrap(a, 'openExp', (id) => (app === 'maths' ? ['maths.' + id, 'science.' + id] : ['science.' + id, 'maths.' + id]));
    wrap(a, 'openLab', (id) => ['body.lab-' + id]);
    wrap(a, 'startJourney', (id) => ['body.j-' + id]);
    wrap(a, 'openLesson', (id) => ['robotics.' + id]);
  }
  let n = 0; const t = setInterval(() => { if (window.app) { guard(window.app); clearInterval(t); } else if (++n > 150) clearInterval(t); }, 200);
  // the Solar System's 3D pages are chosen by the address's #part (#mars, #land, #craft …): checked when it changes
  if (app === 'space') {
    const SP = { '': 'solar', home: 'solar', planets: 'solar', sky: 'stars', land: 'land360', 'land-chandrayaan3': 'ch3', missions: 'imissions' };
    const check = () => { const h = decodeURIComponent(location.hash.slice(1)); if (h === 'xr') return; const k = SP[h] || (h.startsWith('land-') ? 'land360' : h.startsWith('craft-') ? 'craft' : h); const id = item('space.' + k); if (id && has(id) === 'no') need(id); };
    if (!/[?&]app=/.test(location.search)) check();
    addEventListener('hashchange', check);
  }
})();
