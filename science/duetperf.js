/* DUET STEM: smooth 3D on phones and tablets. Same file in every app.
   - Phones start with a lighter picture: pixel ratio 1.5 at most (instead of 2-3: almost the same sharpness, about half the
     pixels to draw), and never more than about 1.3 million pixels for the whole screen (an unfolded Galaxy Z Fold is large).
   - The sharpness then follows the frame rate: below ~50 frames a second it steps down (1.25, 1, 0.85); when it runs smoothly
     for a while it steps back up, but never to a step that already failed twice.
   - Phones with 120 Hz screens draw at most 60 frames a second: the same smooth movement, half the heat and battery.
   Renderers that another part of the app sizes itself (for example the VR box mode) are left alone, and nothing changes
   inside a headset session. For a test: ?pr=2 fixes the pixel ratio, ?fps=full lifts the 60 frames limit. */
(function () {
  'use strict';
  if (window.DuetPerf) return;
  var ua = navigator.userAgent || '';
  var QUEST = /OculusBrowser|Quest|Pico/i.test(ua);
  var PHONE = !QUEST && (!!window.DuetNative || /Android|iPhone|iPad|iPod|Mobi/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1));
  var qpr = /[?&]pr=([\d.]+)/.exec(location.search), FULL = /[?&]fps=full/.test(location.search);
  var BUDGET = 1.3e6; // pixels for the whole screen on a phone or tablet
  var CAP = 1, STEPS = [1], step = 0, fails = [0];
  function steps() {
    var dpr = window.devicePixelRatio || 1, cap;
    if (qpr) cap = +qpr[1];
    else if (PHONE) cap = Math.max(1, Math.min(dpr, 1.5, Math.sqrt(BUDGET / Math.max(1, innerWidth * innerHeight))));
    else cap = Math.min(dpr, 2);
    cap = Math.round(cap * 100) / 100;
    if (cap === CAP && STEPS.length > 1) return false;
    CAP = cap; STEPS = [cap];
    [1.25, 1, 0.85].forEach(function (v) { if (v < cap - 0.1) STEPS.push(v); });
    step = Math.min(step, STEPS.length - 1); fails = STEPS.map(function () { return 0; });
    return true;
  }
  steps();

  // 120 Hz phones: every second screen refresh is skipped (90 Hz and 60 Hz screens are not changed)
  if (PHONE && !FULL && window.requestAnimationFrame) {
    var raf0 = window.requestAnimationFrame.bind(window), caf0 = window.cancelAnimationFrame.bind(window);
    var lastT = 0, seq = 0, inner = {};
    window.requestAnimationFrame = function (cb) {
      var id = ++seq;
      var run = function (t) {
        if (lastT && t !== lastT && t - lastT < 10) { inner[id] = raf0(run); return; } // too soon after the last frame drawn
        delete inner[id]; lastT = t; cb(t);
      };
      inner[id] = raf0(run); return id;
    };
    window.cancelAnimationFrame = function (id) { if (inner[id] != null) { caf0(inner[id]); delete inner[id]; } };
  }

  var list = [], frames = 0, t0 = 0, last = 0, iv = [], bad = 0, good = 0, quietUntil = 0, log = [];
  function presenting() { for (var i = 0; i < list.length; i++) { var r = list[i]; if (r.xr && r.xr.isPresenting) return true; } return false; }
  function apply() {
    var pr = STEPS[step];
    list.forEach(function (r) {
      if (r.xr && r.xr.isPresenting) return;
      if (r.__duetPR != null && Math.abs(r.getPixelRatio() - r.__duetPR) > 0.01) return; // the app sizes this one itself
      var v = Math.min(pr, r.__duetMax || 9);
      if (Math.abs(r.getPixelRatio() - v) > 0.01) r.setPixelRatio(v);
      r.__duetPR = v;
    });
    quietUntil = performance.now() + 3000; // let the new size settle before measuring again
    log.push(Math.round(performance.now() / 1000) + 's:' + pr);
    try { console.info('[DuetPerf] pixel ratio ' + pr + ' (fps ' + DP.fps + ')'); } catch (e) { /* no console */ } // shows in the phone's log (adb logcat)
    if (log.length > 20) log.shift();
  }
  function tick(now) {
    requestAnimationFrame(tick);
    if (document.hidden || !list.length || now < quietUntil || presenting()) { frames = 0; t0 = now; last = 0; iv = []; return; }
    if (!t0) { t0 = now; frames = 0; return; }
    frames++; if (last) iv.push(now - last); last = now;
    var el = now - t0;
    if (el < 2000) return;
    var fps = frames * 1000 / el; frames = 0; t0 = now;
    iv.sort(function (a, b) { return a - b; });
    var med = iv[iv.length >> 1] || 0, p90 = iv[Math.floor(iv.length * 0.9)] || 0; iv = [];
    DP.fps = Math.round(fps);
    // (an even 30 fps is not treated as a power-saving limit: on a 60 Hz screen a picture that is a little too slow
    // also shows as exactly 30 fps; measured on an OPPO F21s Pro, where 45 fps still looked uneven, hence 50)
    if (fps < 50) {
      good = 0;
      if (++bad >= 2 && step < STEPS.length - 1) { bad = 0; fails[step]++; step++; apply(); }
    } else if (fps > 57) {
      bad = 0;
      if (++good >= 5 && step > 0 && fails[step - 1] < 2) { good = 0; step--; apply(); }
    } else { bad = 0; good = 0; }
  }
  var start = function () { quietUntil = performance.now() + 6000; requestAnimationFrame(tick); }; // the first seconds are loading
  document.addEventListener('visibilitychange', function () { if (!document.hidden) quietUntil = performance.now() + 3000; });
  window.addEventListener('resize', function () { // folded or unfolded, turned: a new pixel budget
    quietUntil = performance.now() + 3000;
    if (steps()) { DP.cap = CAP; apply(); }
  });
  var DP = window.DuetPerf = {
    phone: PHONE, cap: CAP, fps: 0,
    /** the pixel ratio to start a new renderer with */
    pr: function () { return STEPS[step]; },
    /** follow this renderer: its pixel ratio is set now and adjusted with the frame rate (never above max, if given) */
    watch: function (r, max) { if (!r || list.indexOf(r) >= 0) return r; list.push(r); r.__duetMax = max || 0; var v = Math.min(STEPS[step], max || 9); r.setPixelRatio(v); r.__duetPR = v; return r; },
    unwatch: function (r) { var i = list.indexOf(r); if (i >= 0) list.splice(i, 1); },
    info: function () { return { phone: PHONE, cap: CAP, pr: STEPS[step], steps: STEPS, fps: DP.fps, renderers: list.length, log: log.join(' ') }; }
  };
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
