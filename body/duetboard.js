/* DUET STEM teacher board: classroom panels and projectors. Same file in every app (science/ is the master copy).
   - Panel mode turns on by itself on a large touch screen (an interactive flat panel: touch and the shorter side of the
     screen at least 1000 CSS px), or with ?panel=1 (?panel=0 turns it off; both are remembered on this device).
     Elsewhere (laptop, desktop + projector) a small "Teacher" tab on the right edge turns it on. Phones and headsets
     show nothing.
   - In panel mode the app's buttons and texts are drawn bigger, so they can be read from the back of the class (the
     overlay is scaled with CSS zoom; the 3D picture keeps its own resolution, so the GPU does no extra work).
     A− / A+ change the size.
   - A small floating teacher toolbar (a round Teacher button until it is opened): a pen to write and draw over the 3D
     (finger, stylus or mouse; colours, sizes, eraser, undo, clear), a spotlight, text size, full screen, "All apps" (on
     a DUET STEM pen drive), Close and Teacher mode off. It places itself where it covers the least of the app's panels
     (or where the teacher drags it), and its colours open beside it, never off the screen.
     The drawing has its own 2D canvas over the page; it takes the touches only while the pen is on, so the app's own
     touch controls work as usual when it is off. Esc turns the pen or the spotlight off.
   - Everything hides while a headset session (WebXR), the phone VR box or Camera AR runs.
   DuetBoard.set(true|false) · DuetBoard.pen(true|false) · DuetBoard.info()   (for tests) */
(function () {
  'use strict';
  if (window.DuetBoard) return;
  var ua = navigator.userAgent || '';
  var HEADSET = /OculusBrowser|Quest|Pico|Vive|Wolvic/i.test(ua);
  var IPAD = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var KEY = 'duet.board.v1';
  var get = function () { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  var P = get(); // on: true / false (chosen) or absent (automatic) · f: text size step · x, y: toolbar place (0..1) · open: toolbar open
  var put = function () { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* private window */ } };
  var qm = /[?&]panel=([01])\b/.exec(location.search);
  if (qm) { P.on = qm[1] === '1'; put(); }

  // ------------------------------------------------------------------ headset sessions (any app): hide meanwhile
  var xrLive = 0;
  try {
    if (navigator.xr && typeof navigator.xr.requestSession === 'function') {
      var rs0 = navigator.xr.requestSession;
      navigator.xr.requestSession = function () {
        return rs0.apply(navigator.xr, arguments).then(function (s) {
          xrLive++; soon();
          try { s.addEventListener('end', function () { xrLive = Math.max(0, xrLive - 1); soon(); }); } catch (e) { /* no events */ }
          return s;
        });
      };
    }
  } catch (e) { /* read-only */ }

  // ------------------------------------------------------------------ the apps
  // zoom: the overlay parts drawn bigger (a part that holds a canvas is never zoomed: its own children are looked at);
  // avoid: more of the app's controls the toolbar keeps clear of (touch sticks); xr: while one of these matches, the
  // board hides (phone VR box / Camera AR / headset view)
  var CFG = {
    science: { zoom: '#top,#list,#story,#notebook,#toast,#classpick,#xr-wait', avoid: '#joy', xr: 'body.pxr-on,body.in-vr,body.in-ar' },
    body: { zoom: '#top,#left,#right,#organ-drawer,#story,#toast,#credits,#xr-wait', avoid: '#joy', xr: 'body.pxr-on,body.in-xr' },
    drone: { zoom: '#bar,#toast,#lesson,#replay,#remote,#app>.modal,#settings,#loading', avoid: '#padL,#padR,#tbtns,#mini', xr: '', both: true },
    space: { zoom: 'header.bar,.worlds,main>section>*,footer.foot', xr: '.xr-full', both: true,
      // the 3D stages' heights have a cap in px: it grows with the zoom, so the bigger texts over them still fit
      css: '.stage,.xr:not(.xr-full){height:clamp(calc(460px*var(--dbz)),74vh,calc(780px*var(--dbz)))!important}'
        + '.panostage{height:clamp(calc(380px*var(--dbz)),64vh,calc(720px*var(--dbz)))!important}'
        + '.craftstage{height:clamp(calc(460px*var(--dbz)),76vh,calc(820px*var(--dbz)))!important}'
        + '.nearstage{height:clamp(calc(420px*var(--dbz)),62vh,calc(660px*var(--dbz)))!important}'
        + '.gstage{min-height:calc(560px*var(--dbz))!important}'
        // the planet names over the 3D: bigger letters (they are placed by the app's code, so they are not zoomed)
        + '.plabel{font-size:calc(11px*var(--dbz))!important;padding:calc(2px*var(--dbz)) calc(7px*var(--dbz))!important}.plabel.minor{font-size:calc(10px*var(--dbz))!important}' }
  };
  CFG.maths = CFG.science;
  // a new app (such as robotics/): add its line above for the bigger text; without one it still gets the pen and tools
  var SKIP = /label|tooltip|ghost|(^|[^a-z])tips?([^a-z]|$)/i; // label layers placed over the 3D by the app's own code, big background words
  function whichApp() {
    if (window.DUET_APP === 'maths' || /\/maths\//.test(location.pathname)) return 'maths';
    if (document.getElementById('organ-drawer')) return 'body';
    if (document.getElementById('subjects') || document.getElementById('explist')) return 'science';
    if (document.querySelector('#app>#bar')) return 'drone';
    if (document.querySelector('header.bar .nav')) return 'space';
    var m = /\/(science|body|space|drone|robotics)\//.exec(location.pathname); return m ? m[1] : '';
  }

  // ------------------------------------------------------------------ words (the app's language: English, Hindi, Hinglish)
  var T = {
    teacher: ['Teacher', 'शिक्षक', 'Teacher'],
    pen: ['Pen', 'पेन', 'Pen'],
    eraser: ['Eraser', 'रबर', 'Rubber'],
    undo: ['Undo', 'वापस', 'Undo'],
    clear: ['Clear', 'सब मिटाएँ', 'Sab mitao'],
    size: ['Size', 'मोटाई', 'Size'],
    spot: ['Spotlight', 'रोशनी', 'Spotlight'],
    text: ['Text size', 'अक्षर का आकार', 'Text size'],
    full: ['Full screen', 'पूरी स्क्रीन', 'Full screen'],
    unfull: ['Small screen', 'छोटी स्क्रीन', 'Chhoti screen'],
    home: ['All apps', 'सभी ऐप', 'Sab apps'],
    close: ['Close', 'बंद', 'Band'],
    off: ['Teacher mode off', 'शिक्षक मोड बंद', 'Teacher mode band'],
    tab: ['Teacher mode: big text, pen', 'शिक्षक मोड: बड़े अक्षर, पेन', 'Teacher mode: bade akshar, pen'],
    penHint: ['Write with your finger. Tap Pen again to use the app.', 'उँगली से लिखिए। ऐप चलाने के लिए पेन फिर से दबाइए।', 'Ungli se likhiye. App chalane ke liye Pen phir se dabaiye.'],
    spotHint: ['Drag the light. Tap Spotlight again to stop.', 'रोशनी को उँगली से खींचिए। बंद करने के लिए फिर से दबाइए।', 'Roshni ko ungli se kheechiye. Band karne ke liye phir se dabaiye.']
  };
  var app = '', cfg = null;
  function langIx() {
    if (cfg && cfg.both) return -1; // an English app: English and Hindi together
    var a = window.app, l = (a && typeof a.lang === 'string' && a.lang) || document.documentElement.lang || 'en';
    return l === 'hi' || l === 'mr' ? 1 : l === 'hg' ? 2 : 0;
  }
  function tx(k) { var o = T[k], i = langIx(); return i < 0 ? o[0] : o[i]; }
  function tx2(k) { var o = T[k], i = langIx(); return i < 0 ? o[1] : ''; } // the Hindi line under the English, in an English app

  // ------------------------------------------------------------------ is this a classroom panel?
  function phoneSized() { return Math.min(innerWidth, innerHeight) < 600 || Math.min(screen.width, screen.height) < 600; }
  function autoPanel() {
    if (HEADSET || IPAD) return false;
    var touch = (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && matchMedia('(any-pointer: coarse)').matches);
    return !!touch && Math.min(screen.width, screen.height) >= 1000;
  }
  function wanted() { return P.on === true || (P.on !== false && autoPanel()); }
  var STEPS = [0.7, 0.8, 0.9, 1, 1.15, 1.3, 1.5], DEF = 3;
  function step() { var f = P.f; return typeof f === 'number' && f >= 0 && f < STEPS.length ? f : DEF; }
  // the overlay looks as it does on a 1280 × 720 laptop, filling the panel (1.5× on a 1920 × 1080 panel, 3× on 4K at 100%)
  function baseScale() { return Math.max(1, Math.min(3, Math.min(innerWidth / 1280, innerHeight / 720))); }
  function uiScale() { return Math.round(Math.max(0.8, baseScale() * STEPS[step()]) * 100) / 100; }
  function toolScale() { return Math.max(1, Math.min(2.6, baseScale() * 0.8)); } // the toolbar keeps about the same size on the glass

  // ------------------------------------------------------------------ state
  var on = false, hidden = false, penOn = false, spotOn = false, eraser = false, open = P.open === true; // at first only the small Teacher button
  var colour = P.c || '#ff3b30', sizeIx = typeof P.s === 'number' ? P.s : 1, pendrive = false;
  var COLOURS = ['#ff3b30', '#ffd60a', '#34c759', '#1e9bff', '#ffffff', '#111111'];
  var SIZES = [3, 6, 12];
  var host, root, wrap, bar, pal, ink, ctx, spot, tab, hint, css;
  var strokes = [], live = {}, inkK = 1, hintT = 0;

  var ICON = {
    pen: '<path d="M4 20l1-4.5L16.2 4.3a2 2 0 0 1 2.9 0l.6.6a2 2 0 0 1 0 2.9L8.5 19 4 20z"/><path d="M14.5 6l3.5 3.5"/>',
    eraser: '<path d="M8.5 20H20"/><path d="M5.6 15.4l8.8-8.8a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 19H8.2l-2.6-2.6a.7.7 0 0 1 0-1z"/><path d="M9.5 11.5l4.5 4.5"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    clear: '<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
    spot: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    unfull: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
    home: '<path d="M3.5 11L12 3.5l8.5 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    board: '<rect x="3" y="3.5" width="18" height="12.5" rx="1.5"/><path d="M8 20.5l4-4.5 4 4.5"/><path d="M7 12.5l3-3 2.5 2 4-4.5"/>',
    off: '<path d="M12 3v8"/><path d="M6.3 6.6a8 8 0 1 0 11.4 0"/>',
    size: '<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="19" cy="12" r="3.5"/>'
  };
  var svg = function (k) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>'; };

  // ------------------------------------------------------------------ bigger overlay (CSS zoom on the app's own panels)
  var zoomed = [];
  function zoomTargets() {
    var out = [];
    if (!cfg || !cfg.zoom) return out;
    var add = function (el, depth) {
      if (!el || el.nodeType !== 1 || el === host) return;
      var tag = el.tagName;
      if (tag === 'CANVAS' || tag === 'VIDEO' || tag === 'IFRAME' || tag === 'SCRIPT' || tag === 'STYLE') return;
      if (SKIP.test(el.id || '') || SKIP.test(typeof el.className === 'string' ? el.className : '')) return;
      if (!el.querySelector('canvas')) { out.push(el); return; }
      if (depth < 3) for (var c = el.firstElementChild; c; c = c.nextElementSibling) add(c, depth + 1); // a 3D stage: only the panels beside the canvas
    };
    var list = document.querySelectorAll(cfg.zoom);
    for (var i = 0; i < list.length; i++) add(list[i], 0);
    return out;
  }
  // (a headset view or the phone VR box leaves the zoom as it is: the app hides its panels there itself)
  function applyZoom() {
    var want = on ? zoomTargets() : [], changed = false, z = String(uiScale()), de = document.documentElement;
    for (var i = 0; i < zoomed.length; i++) if (want.indexOf(zoomed[i]) < 0) { zoomed[i].removeAttribute('data-dbz'); changed = true; }
    for (var j = 0; j < want.length; j++) if (!want[j].hasAttribute('data-dbz')) { want[j].setAttribute('data-dbz', ''); changed = true; }
    zoomed = want;
    if (de.style.getPropertyValue('--dbz') !== z) { de.style.setProperty('--dbz', z); changed = true; }
    if (de.classList.contains('duet-board') !== on) { de.classList.toggle('duet-board', on); changed = true; }
    return changed;
  }
  var zt = 0;
  function rezoomSoon() { if (!zt) zt = setTimeout(function () { zt = 0; if (on && applyZoom()) kick(); }, 250); }
  var kickT = 0;
  var selfKick = false;
  function kick() { clearTimeout(kickT); kickT = setTimeout(function () { selfKick = true; try { window.dispatchEvent(new Event('resize')); } catch (e) { /* old */ } selfKick = false; }, 60); } // the app lays out again (its 3D view keeps clear of the bigger panels)

  // ------------------------------------------------------------------ the toolbar
  function build() {
    css = document.createElement('style');
    css.textContent = 'html.duet-board [data-dbz]{zoom:var(--dbz,1)!important}'
      + 'html.duet-pendrive #btn-save{display:none!important}'
      + (cfg && cfg.css ? cfg.css.replace(/(^|\})([^{}]+)\{/g, function (m0, b, sel) { return b + sel.split(',').map(function (x) { return 'html.duet-board ' + x; }).join(',') + '{'; }) : '');
    (document.head || document.documentElement).appendChild(css);
    host = document.createElement('div'); host.id = 'duetboard';
    host.setAttribute('style', 'position:fixed;inset:0;pointer-events:none;z-index:99980;display:block');
    root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    root.innerHTML = '<style>'
      + '.w{position:fixed;inset:0;pointer-events:none;font:600 13px/1.15 "Noto Sans Devanagari","Noto Sans",system-ui,-apple-system,"Segoe UI",sans-serif;color:#f2ede4;-webkit-user-select:none;user-select:none;--u:1px}'
      + 'canvas{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;touch-action:none;display:none}'
      + '.w.is-pen canvas{pointer-events:auto;cursor:crosshair}'
      + '.spot{position:absolute;inset:0;display:none;pointer-events:auto;touch-action:none;cursor:grab}'
      + '.w.is-spot .spot{display:block}'
      + 'button{all:unset;box-sizing:border-box;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}'
      + 'button:focus-visible{outline:calc(3*var(--u)) solid #7fd1ff;outline-offset:calc(2*var(--u))}'
      + '.bar{position:absolute;pointer-events:auto;display:grid;grid-template-columns:repeat(2,calc(64*var(--u)));gap:calc(4*var(--u));padding:calc(6*var(--u));background:#121722;border:calc(1*var(--u)) solid rgba(255,255,255,.16);border-radius:calc(16*var(--u));box-shadow:0 calc(10*var(--u)) calc(30*var(--u)) rgba(0,0,0,.45);touch-action:none}'
      + '.bar .wide{grid-column:1/-1}.bar .b{width:auto}'
      + '.grip{height:calc(12*var(--u));border-radius:calc(6*var(--u));cursor:grab;display:flex;justify-content:center;align-items:center}'
      + '.grip i{width:calc(28*var(--u));height:calc(4*var(--u));border-radius:calc(2*var(--u));background:rgba(255,255,255,.28)}'
      + '.b{width:calc(64*var(--u));min-height:calc(52*var(--u));padding:calc(4*var(--u)) calc(2*var(--u));display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(3*var(--u));border-radius:calc(12*var(--u));text-align:center;color:#f2ede4}'
      + '.b:hover{background:rgba(255,255,255,.08)}'
      + '.b svg{width:calc(26*var(--u));height:calc(26*var(--u));flex:none}'
      + '.b span{font-size:calc(11.5*var(--u));line-height:1.1;max-width:100%;overflow-wrap:anywhere}'
      + '.b small{font-size:calc(10*var(--u));opacity:.75;line-height:1.1}'
      + '.b.on{background:#f0a65a;color:#14100a}'
      + '.row{display:flex;gap:calc(4*var(--u));align-items:center}.row .b{flex:1;width:auto;min-height:calc(40*var(--u));font-size:calc(17*var(--u));font-weight:800}'
      + '.pct{font-size:calc(10.5*var(--u));text-align:center;opacity:.75;min-width:calc(30*var(--u))}'
      + '.sep{height:calc(1*var(--u));background:rgba(255,255,255,.12);margin:calc(2*var(--u)) calc(4*var(--u))}'
      + '.b.mini{min-height:calc(40*var(--u))}.b.mini svg{width:calc(20*var(--u));height:calc(20*var(--u))}.b.mini span{font-size:calc(10*var(--u))}'
      + '.pal{position:absolute;pointer-events:auto;display:none;align-items:center;gap:calc(6*var(--u));padding:calc(8*var(--u));background:#121722;border:calc(1*var(--u)) solid rgba(255,255,255,.16);border-radius:calc(16*var(--u));box-shadow:0 calc(10*var(--u)) calc(30*var(--u)) rgba(0,0,0,.45);flex-wrap:wrap;max-width:calc(100vw - 20px);box-sizing:border-box}'
      + '.w.is-pen .pal{display:flex}'
      + '.sw{width:calc(40*var(--u));height:calc(40*var(--u));border-radius:50%;border:calc(3*var(--u)) solid rgba(255,255,255,.25);flex:none}'
      + '.sw.on{border-color:#fff;box-shadow:0 0 0 calc(3*var(--u)) #f0a65a}'
      + '.pal .b{width:calc(58*var(--u));min-height:calc(50*var(--u))}'
      + '.vs{width:calc(1*var(--u));align-self:stretch;background:rgba(255,255,255,.12)}'
      + '.fab{position:absolute;pointer-events:auto;width:calc(66*var(--u));height:calc(66*var(--u));border-radius:50%;background:#121722;border:calc(2*var(--u)) solid #f0a65a;box-shadow:0 calc(8*var(--u)) calc(24*var(--u)) rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:calc(1*var(--u));color:#f2ede4;touch-action:none}'
      + '.fab svg{width:calc(26*var(--u));height:calc(26*var(--u))}.fab span{font-size:calc(10*var(--u))}'
      + '.tab{position:absolute;right:0;top:50%;transform:translateY(-50%);pointer-events:auto;width:16px;height:64px;border-radius:10px 0 0 10px;background:rgba(18,23,34,.82);border:1px solid rgba(255,255,255,.2);border-right:0;display:flex;align-items:center;justify-content:center;color:#f0a65a;opacity:.7;transition:width .15s,opacity .15s;overflow:hidden}'
      + '.tab:hover,.tab:focus-visible{width:40px;opacity:1}.tab svg{width:14px;height:14px;flex:none}'
      + '.hint{position:absolute;left:50%;top:calc(14*var(--u));transform:translateX(-50%);padding:calc(10*var(--u)) calc(18*var(--u));border-radius:calc(12*var(--u));background:rgba(18,23,34,.95);border:calc(1*var(--u)) solid rgba(240,166,90,.6);font-size:calc(15*var(--u));max-width:80vw;text-align:center;opacity:0;transition:opacity .3s;pointer-events:none}'
      + '.hint.show{opacity:1}'
      + '</style>'
      + '<div class="w"><canvas></canvas><div class="spot"></div>'
      + '<div class="bar" role="toolbar"></div><div class="pal" role="group"></div>'
      + '<button class="fab"></button><button class="tab"></button><div class="hint" role="status"></div></div>';
    wrap = root.querySelector('.w'); ink = root.querySelector('canvas'); spot = root.querySelector('.spot');
    bar = root.querySelector('.bar'); pal = root.querySelector('.pal'); tab = root.querySelector('.tab'); hint = root.querySelector('.hint');
    var fab = root.querySelector('.fab');
    ctx = ink.getContext('2d');
    document.body.appendChild(host);

    // pen: one stroke per finger or stylus
    ink.addEventListener('pointerdown', function (e) {
      if (!penOn) return;
      e.preventDefault(); e.stopPropagation();
      try { ink.setPointerCapture(e.pointerId); } catch (err) { /* gone */ }
      var w = SIZES[sizeIx] * toolScale() * (eraser ? 3.5 : 1);
      var s = { c: colour, w: w, er: eraser, p: [e.clientX, e.clientY] };
      strokes.push(s); live[e.pointerId] = s; dot(s); showInk();
    });
    ink.addEventListener('pointermove', function (e) {
      var s = live[e.pointerId]; if (!s) return;
      e.preventDefault();
      var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null; if (!evs || !evs.length) evs = [e];
      for (var i = 0; i < evs.length; i++) { s.p.push(evs[i].clientX, evs[i].clientY); seg(s, s.p.length - 2); }
    });
    var up = function (e) { if (live[e.pointerId]) delete live[e.pointerId]; };
    ink.addEventListener('pointerup', up); ink.addEventListener('pointercancel', up); ink.addEventListener('lostpointercapture', up);
    ink.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // spotlight: drag the light; wheel or two fingers change its size
    var sp = { x: innerWidth / 2, y: innerHeight / 2, r: 0, drag: null };
    var paintSpot = function () {
      if (!sp.r) sp.r = Math.min(innerWidth, innerHeight) * 0.17;
      spot.style.background = 'radial-gradient(circle at ' + sp.x + 'px ' + sp.y + 'px, rgba(0,0,0,0) ' + sp.r + 'px, rgba(0,0,0,.78) ' + (sp.r + 2) + 'px)';
    };
    spot.addEventListener('pointerdown', function (e) { e.preventDefault(); try { spot.setPointerCapture(e.pointerId); } catch (err) { /* gone */ } sp.drag = e.pointerId; sp.x = e.clientX; sp.y = e.clientY; paintSpot(); });
    spot.addEventListener('pointermove', function (e) { if (sp.drag !== e.pointerId) return; sp.x = e.clientX; sp.y = e.clientY; paintSpot(); });
    spot.addEventListener('pointerup', function () { sp.drag = null; });
    spot.addEventListener('pointercancel', function () { sp.drag = null; });
    spot.addEventListener('wheel', function (e) { e.preventDefault(); sp.r = Math.max(40, Math.min(Math.max(innerWidth, innerHeight), sp.r * (e.deltaY < 0 ? 1.12 : 0.89))); paintSpot(); }, { passive: false });
    board.paintSpot = paintSpot; board.sp = sp;

    // the toolbar can be dragged by its grip (or the closed button), and stays where it was put
    var drag = null;
    var startDrag = function (e, el) { drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, r: el.getBoundingClientRect(), moved: false, el: el }; try { el.setPointerCapture(e.pointerId); } catch (err) { /* gone */ } };
    var moveDrag = function (e) {
      if (!drag || drag.id !== e.pointerId) return;
      var dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 10) return;
      drag.moved = true;
      var W = innerWidth - drag.r.width, H = innerHeight - drag.r.height;
      P.x = W > 0 ? Math.max(0, Math.min(1, (drag.r.left + dx) / W)) : 1; P.y = H > 0 ? Math.max(0, Math.min(1, (drag.r.top + dy) / H)) : 1;
      place();
    };
    var endDrag = function (e) { if (!drag || drag.id !== e.pointerId) return false; var m = drag.moved; drag = null; if (m) put(); return m; };
    bar.addEventListener('pointerdown', function (e) { if (e.target.closest && e.target.closest('.grip')) startDrag(e, bar); });
    bar.addEventListener('pointermove', moveDrag); bar.addEventListener('pointerup', endDrag); bar.addEventListener('pointercancel', endDrag);
    var fabMoved = false;
    fab.addEventListener('pointerdown', function (e) { fabMoved = false; startDrag(e, fab); });
    fab.addEventListener('pointermove', moveDrag);
    fab.addEventListener('pointerup', function (e) { fabMoved = endDrag(e); });
    fab.addEventListener('pointercancel', endDrag);
    fab.addEventListener('click', function () { if (fabMoved) { fabMoved = false; return; } setOpen(true); });
    tab.addEventListener('click', function () { P.on = true; P.open = true; open = true; put(); setOn(true); });

    bar.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-a]'); if (b) act(b.getAttribute('data-a')); });
    pal.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-a],[data-c]'); if (!b) return;
      if (b.hasAttribute('data-c')) { colour = b.getAttribute('data-c'); eraser = false; P.c = colour; put(); render(); return; }
      act(b.getAttribute('data-a'));
    });

    addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !(penOn || spotOn)) return;
      e.preventDefault(); e.stopImmediatePropagation(); setPen(false); setSpot(false);
    }, true);
    addEventListener('resize', function () { if (!host) return; if (penOn || strokes.length) sizeInk(); if (on) document.documentElement.style.setProperty('--dbz', String(uiScale())); lastSig = ''; if (!selfKick) autoSpot = {}; render(); if (spotOn) board.paintSpot(); }); // (our own relayout keeps the toolbar where it is)
    document.addEventListener('fullscreenchange', function () { render(); soon(); });
    document.addEventListener('webkitfullscreenchange', function () { render(); soon(); });
  }

  // ------------------------------------------------------------------ drawing
  function sizeInk() {
    var W = innerWidth, H = innerHeight, dpr = window.devicePixelRatio || 1;
    inkK = Math.min(dpr, Math.sqrt(4.2e6 / Math.max(1, W * H))); // at most about 4 million pixels (a 4K panel draws at 0.7)
    var w = Math.max(1, Math.round(W * inkK)), h = Math.max(1, Math.round(H * inkK));
    if (ink.width !== w || ink.height !== h) { ink.width = w; ink.height = h; redraw(); }
  }
  function pen(s) { ctx.globalCompositeOperation = s.er ? 'destination-out' : 'source-over'; ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineWidth = s.w * inkK; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  function dot(s) { pen(s); ctx.beginPath(); ctx.arc(s.p[0] * inkK, s.p[1] * inkK, s.w * inkK / 2, 0, Math.PI * 2); ctx.fill(); }
  function seg(s, i) { // the piece ending at point i (a smooth curve through the middle points)
    var p = s.p, k = inkK; if (i < 2) return;
    pen(s); ctx.beginPath();
    if (i < 4) { ctx.moveTo(p[0] * k, p[1] * k); ctx.lineTo(p[i] * k, p[i + 1] * k); ctx.stroke(); return; }
    var ax = (p[i - 4] + p[i - 2]) / 2, ay = (p[i - 3] + p[i - 1]) / 2, bx = (p[i - 2] + p[i]) / 2, by = (p[i - 1] + p[i + 1]) / 2;
    ctx.moveTo(ax * k, ay * k); ctx.quadraticCurveTo(p[i - 2] * k, p[i - 1] * k, bx * k, by * k); ctx.stroke();
  }
  function redraw() {
    ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, ink.width, ink.height);
    for (var j = 0; j < strokes.length; j++) { var s = strokes[j]; dot(s); for (var i = 2; i < s.p.length; i += 2) seg(s, i); }
  }
  function showInk() { if (ink) ink.style.display = penOn || strokes.length ? 'block' : 'none'; } // no layer over the 3D when there is nothing to show

  // ------------------------------------------------------------------ actions
  function act(a) {
    if (a === 'pen') setPen(!penOn || eraser ? true : false, false);
    else if (a === 'eraser') { if (!penOn) setPen(true); eraser = !eraser; render(); }
    else if (a === 'size') { sizeIx = (sizeIx + 1) % SIZES.length; P.s = sizeIx; put(); render(); }
    else if (a === 'undo') { strokes.pop(); redraw(); showInk(); }
    else if (a === 'clear') { strokes = []; live = {}; redraw(); showInk(); }
    else if (a === 'spot') setSpot(!spotOn);
    else if (a === 'a-') { P.f = Math.max(0, step() - 1); put(); if (applyZoom()) kick(); render(); }
    else if (a === 'a+') { P.f = Math.min(STEPS.length - 1, step() + 1); put(); if (applyZoom()) kick(); render(); }
    else if (a === 'full') fullscreen();
    else if (a === 'home') { location.href = '/'; }
    else if (a === 'close') setOpen(false);
    else if (a === 'off') { P.on = false; put(); setOn(false); }
  }
  function setPen(v, keepEraser) {
    penOn = !!v; if (!keepEraser) eraser = false;
    if (penOn) { setSpot(false); sizeInk(); flash('penHint'); }
    showInk(); render();
  }
  function setSpot(v) {
    spotOn = !!v; if (spotOn) { if (penOn) setPen(false); board.sp.r = 0; board.sp.x = innerWidth / 2; board.sp.y = innerHeight / 2; board.paintSpot(); flash('spotHint'); }
    render();
  }
  function setOpen(v) { open = !!v; P.open = open; put(); autoSpot = {}; if (!open) { setPen(false); setSpot(false); } render(); }
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
  function fullscreen() {
    var d = document.documentElement;
    try {
      if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      var r = (d.requestFullscreen || d.webkitRequestFullscreen).call(d, { navigationUI: 'hide' }); if (r && r.catch) r.catch(function () { /* refused */ });
    } catch (e) { /* not here */ }
  }
  function flash(k) { hint.textContent = tx(k); if (tx2(k)) hint.textContent += ' · ' + tx2(k); hint.classList.add('show'); clearTimeout(hintT); hintT = setTimeout(function () { hint.classList.remove('show'); }, 3200); }

  // ------------------------------------------------------------------ drawing the toolbar
  function btn(a, icon, k, cls) {
    var two = tx2(k);
    return '<button class="b' + (cls ? ' ' + cls : '') + '" data-a="' + a + '" aria-label="' + tx(k) + (two ? ' / ' + two : '') + '" title="' + tx(k) + (two ? ' / ' + two : '') + '">' + svg(icon) + '<span>' + tx(k) + '</span>' + (two ? '<small>' + two + '</small>' : '') + '</button>';
  }
  var lastSig = '';
  function render() {
    if (!host) return;
    var u = toolScale(); wrap.style.setProperty('--u', u + 'px');
    wrap.classList.toggle('is-pen', penOn); wrap.classList.toggle('is-spot', spotOn); // (not 'spot': that is the overlay's own class)
    var fs = !!fsEl(), canFs = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    var sig = [on, hidden, open, penOn, eraser, spotOn, colour, sizeIx, step(), fs, canFs, pendrive, langIx(), u].join('|');
    if (sig !== lastSig) {
      lastSig = sig;
      var fab = root.querySelector('.fab');
      var showBar = on && !hidden && open, showFab = on && !hidden && !open, showTab = !on && !hidden && !phoneSized() && !HEADSET;
      bar.style.display = showBar ? 'grid' : 'none';
      fab.style.display = showFab ? 'flex' : 'none';
      tab.style.display = showTab ? 'flex' : 'none';
      if (showTab) { tab.innerHTML = svg('board'); tab.title = tx('tab') + (tx2('tab') ? ' · ' + tx2('tab') : ''); tab.setAttribute('aria-label', tab.title); }
      if (showFab) { fab.innerHTML = svg('board') + '<span>' + tx('teacher') + '</span>' + (tx2('teacher') ? '<span>' + tx2('teacher') + '</span>' : ''); fab.title = tx('teacher'); fab.setAttribute('aria-label', tx('teacher')); }
      if (showBar) {
        // two columns: pen, spotlight / all apps, full screen / text size / close, teacher mode off
        var cells = [btn('pen', 'pen', 'pen', penOn && !eraser ? 'on' : ''), btn('spot', 'spot', 'spot', spotOn ? 'on' : '')];
        if (pendrive) cells.push(btn('home', 'home', 'home'));
        if (canFs) cells.push(btn('full', fs ? 'unfull' : 'full', fs ? 'unfull' : 'full'));
        if (cells.length % 2) cells[cells.length - 1] = cells[cells.length - 1].replace('class="b', 'class="b wide');
        bar.innerHTML = '<div class="grip wide" aria-hidden="true"><i></i></div>' + cells.join('')
          + '<div class="row wide" title="' + tx('text') + '"><button class="b" data-a="a-" aria-label="' + tx('text') + ' −">A−</button><span class="pct">' + Math.round(STEPS[step()] * 100) + '%</span><button class="b" data-a="a+" aria-label="' + tx('text') + ' +">A+</button></div>'
          + '<div class="sep wide"></div>' + btn('close', 'close', 'close', 'mini') + btn('off', 'off', 'off', 'mini');
        var sw = '';
        for (var i = 0; i < COLOURS.length; i++) sw += '<button class="sw' + (!eraser && colour === COLOURS[i] ? ' on' : '') + '" data-c="' + COLOURS[i] + '" style="background:' + COLOURS[i] + '" aria-label="' + COLOURS[i] + '"></button>';
        pal.innerHTML = sw + '<div class="vs"></div>' + btn('size', 'size', 'size') + btn('eraser', 'eraser', 'eraser', eraser ? 'on' : '') + btn('undo', 'undo', 'undo') + btn('clear', 'clear', 'clear');
      } else pal.innerHTML = '';
      place();
    }
  }
  // what the app shows on the screen now (its zoomed parts), so the toolbar can keep clear of it: a panel with a
  // background counts whole (not a full-screen backdrop); a see-through container (a wide page section) counts by
  // what is in it (its buttons and texts)
  function panels() {
    var out = [], W = innerWidth, H = innerHeight, n = 0;
    var see = function (el, depth) {
      if (++n > 400) return;
      var r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.right <= 0 || r.bottom <= 0 || r.left >= W || r.top >= H) return;
      var cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.1) return;
      var solid = cs.backgroundImage !== 'none' || !/^(transparent|rgba\(.*,\s*0\))$/.test(cs.backgroundColor) || parseFloat(cs.borderTopWidth) > 0;
      if (solid || depth >= 4 || !el.firstElementChild) { if (r.width * r.height <= 0.6 * W * H) out.push(r); return; }
      for (var c = el.firstElementChild; c; c = c.nextElementSibling) see(c, depth + 1);
    };
    for (var i = 0; i < zoomed.length; i++) if (zoomed[i].isConnected) see(zoomed[i], 0);
    var more = cfg && cfg.avoid ? document.querySelectorAll(cfg.avoid) : [];
    for (var j = 0; j < more.length; j++) see(more[j], 4);
    return out;
  }
  // the toolbar's place: where the teacher dragged it (x, y: shares of the free space), else the first of these
  // places that covers the least of the app's panels (bottom right, right middle, bottom left, …)
  var SPOTS = [[1, 1], [1, 0.5], [0, 1], [0, 0.5], [1, 0.2], [0, 0.2], [0.5, 1]];
  var autoSpot = {}; // the automatic place, kept while the toolbar stays open (it does not jump when a button is pressed)
  function spotFor(w, h, m, obs, key) {
    if (typeof P.x === 'number' && typeof P.y === 'number') return [P.x, P.y];
    if (autoSpot[key]) return autoSpot[key];
    var best = SPOTS[0], score = Infinity;
    for (var i = 0; i < SPOTS.length; i++) {
      var l = m + SPOTS[i][0] * Math.max(0, innerWidth - w - 2 * m), t = m + SPOTS[i][1] * Math.max(0, innerHeight - h - 2 * m), a = 0;
      for (var j = 0; j < obs.length; j++) { var r = obs[j]; a += Math.max(0, Math.min(l + w, r.right) - Math.max(l, r.left)) * Math.max(0, Math.min(t + h, r.bottom) - Math.max(t, r.top)); }
      if (a < score - 1) { score = a; best = SPOTS[i]; }
      if (!a) break;
    }
    return (autoSpot[key] = best);
  }
  function place() {
    if (!host) return;
    var m = 8, els = [bar, root.querySelector('.fab')], obs = null;
    for (var i = 0; i < els.length; i++) {
      var el = els[i]; if (el.style.display === 'none') continue;
      var w = el.offsetWidth, h = el.offsetHeight;
      var key = el === bar ? 'bar' : 'fab';
      if (!obs && !autoSpot[key]) obs = typeof P.x === 'number' ? [] : panels();
      var s = spotFor(w, h, m, obs || [], key);
      el.style.left = Math.round(m + s[0] * Math.max(0, innerWidth - w - 2 * m)) + 'px';
      el.style.top = Math.round(m + s[1] * Math.max(0, innerHeight - h - 2 * m)) + 'px';
    }
    if (pal.innerHTML && bar.style.display !== 'none') { // the pen's colours beside the toolbar (never over it, never off the screen)
      pal.style.left = '0px'; pal.style.top = '0px'; // measured at its own width
      var r = bar.getBoundingClientRect(), pw = pal.offsetWidth, ph = pal.offsetHeight, g = 8, left, top;
      var roomL = r.left - g - m, roomR = innerWidth - r.right - g - m;
      var pb = bar.querySelector('[data-a="pen"]'), pr = pb ? pb.getBoundingClientRect() : r;
      if (pw <= roomL || pw <= roomR) { // beside it: on the side towards the middle of the screen when both have room
        left = pw <= roomL && (roomL >= roomR || pw > roomR) ? r.left - g - pw : r.right + g;
        top = Math.max(m, Math.min(innerHeight - ph - m, pr.top + pr.height / 2 - ph / 2));
      } else { // no room beside it: above or under it
        left = Math.max(m, Math.min(innerWidth - pw - m, r.right - pw));
        top = r.top - g - ph >= m ? r.top - g - ph : Math.min(innerHeight - ph - m, r.bottom + g);
      }
      pal.style.left = Math.round(left) + 'px'; pal.style.top = Math.round(top) + 'px';
    }
  }

  // ------------------------------------------------------------------ on / off, hidden in headset views
  function xrNow() {
    if (xrLive > 0) return true;
    if (cfg && cfg.xr && document.querySelector(cfg.xr)) return true;
    var f = fsEl(); if (f && f !== document.documentElement && f !== document.body) return true; // a 3D view of the app's own in full screen
    return false;
  }
  function setOn(v) {
    on = !!v;
    if (!on) { setPen(false); setSpot(false); }
    if (applyZoom()) kick(); render();
  }
  var st = 0;
  function soon() { if (!st) st = setTimeout(function () { st = 0; tick(); }, 30); }
  function tick() {
    if (!host) return;
    var h = xrNow();
    if (h !== hidden) {
      hidden = h;
      if (hidden) { if (penOn) setPen(false); if (spotOn) setSpot(false); }
      host.style.display = hidden ? 'none' : 'block';
    }
    var w = wanted(); if (w !== on) setOn(w); else render();
    // the small Teacher button moves out of the way when the app shows something new there (such as touch sticks);
    // the open toolbar stays where it is
    if (on && !hidden && !open && typeof P.x !== 'number' && ++ticks % 3 === 0) { autoSpot.fab = null; place(); }
  }
  var ticks = 0;

  // (tests) how much of what the app shows each visible part of the board covers, in px², and whether it is all on the screen
  function cover() {
    if (!host) return null;
    var obs = panels(), out = {}, parts = { bar: bar, fab: root.querySelector('.fab'), pal: pal, tab: tab };
    for (var k in parts) {
      var el = parts[k]; if (!el || getComputedStyle(el).display === 'none') continue;
      var r = el.getBoundingClientRect(), a = 0; if (!r.width) continue;
      for (var j = 0; j < obs.length; j++) { var q = obs[j]; a += Math.max(0, Math.min(r.right, q.right) - Math.max(r.left, q.left)) * Math.max(0, Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top)); }
      out[k] = { covers: Math.round(a), onScreen: r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5, rect: [r.left, r.top, r.right, r.bottom].map(Math.round) };
    }
    return out;
  }
  var board = window.DuetBoard = {
    get active() { return on; },
    set: function (v) { P.on = !!v; put(); setOn(!!v); },
    auto: function () { delete P.on; put(); setOn(wanted()); },
    pen: function (v) { if (!on) board.set(true); setOpen(true); setPen(v !== false); },
    clear: function () { act('clear'); },
    info: function () { return { app: app, on: on, hidden: hidden, open: open, pen: penOn, spot: spotOn, strokes: strokes.length, scale: uiScale(), tool: toolScale(), zoomed: zoomed.map(function (e) { return e.id || e.className || e.tagName; }), pendrive: pendrive, auto: autoPanel(), lang: langIx(), cover: cover() }; }
  };

  function start() {
    if (host || !document.body) return;
    app = whichApp(); cfg = CFG[app] || { zoom: '', xr: '' };
    build(); // (the drawing canvas gets its size only when the pen is first used)
    on = wanted(); if (applyZoom()) kick(); render();
    setInterval(tick, 1000); // language, headset views, a panel turned on or off (cheap checks)
    if (window.MutationObserver) {
      new MutationObserver(function (recs) { // the app adds its panels (or a 3D canvas) later
        if (!on) return;
        for (var i = 0; i < recs.length; i++) {
          var r = recs[i], a = r.addedNodes;
          for (var j = 0; j < a.length; j++) {
            var n = a[j]; if (n.nodeType !== 1 || n === host) continue;
            if (r.target === document.body || n.tagName === 'CANVAS' || (n.firstElementChild && n.querySelector('canvas'))) { rezoomSoon(); return; }
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
      new MutationObserver(soon).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    // on a DUET STEM pen drive (served by its launcher on this computer): an "All apps" button back to the drive's home page
    var port = +location.port;
    if (/^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname) && port >= 8740 && port < 8760 && window.fetch) { // (the launcher's ports only: no 404 in a developer's server)
      fetch('/pendrive.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.duet) return;
        pendrive = true; document.documentElement.classList.add('duet-pendrive'); render();
        var ls = document.getElementById('landSave'); if (ls && ls.parentNode) ls.parentNode.hidden = true; // everything is on the drive already
      }).catch(function () { /* not a pen drive */ });
    }
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  addEventListener('load', function () { start(); rezoomSoon(); });
})();
