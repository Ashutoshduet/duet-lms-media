/* DUET STEM school code for the DUET Quest apps (Human Body 360, Solar System 360, Drone Simulator).
   A school gets a code from DUET STEM; without one the app always runs as a free demo with a small part open
   (the app asks DuetGate.allow(isFree) before opening anything; a locked part brings up the code screen).
   Codes are checked once online against ../licences.json (SHA-256 hashes, end date, the apps a code opens and
   the school's name encrypted with the code), then the app works offline until the end date. Online, it looks
   again, so a renewed, changed or withdrawn code takes effect.

   DuetGate.init({ app: 'body', title: 'Human Body 360', lang: () => 'en', demo: { en: 'what is free' } })   once, at start
   DuetGate.attachVR({ THREE, renderer, scene, parent })                        when a three.js renderer exists: in the
                                                                                 headset the code screen is a panel there
   DuetGate.allow(isFree)  true when the app may open it (a code, or a free part); otherwise shows the code screen
   DuetGate.active   true while the code screen is up (the app ignores its own clicks then)
   DuetGate.open()   show the code screen on demand (for an "Enter code" button) */
(function () {
  'use strict';
  if (window.DuetGate) return;
  const SRC = (document.currentScript && document.currentScript.src) || location.href;
  const LIST = new URL('../licences.json', SRC).href;
  const LOGO = new URL('brand/duet-stem-logo-light.png', SRC).href;
  const HELP = new URL('../support.html', SRC).href;
  const KEY = 'duet.lic.v1';
  const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: no I, L, O, U
  const norm = (s) => { let t = String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1'); if (t.startsWith('DUET')) t = t.slice(4); return [...t].filter((c) => ALPHA.includes(c)).join(''); };
  const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
  const sha = (s) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  const codeHash = async (c) => hex(await sha('duet-lic|' + norm(c)));
  async function openName(code, e) {
    try {
      const raw = Uint8Array.from(atob(e), (c) => c.charCodeAt(0)); const k = await crypto.subtle.importKey('raw', await sha('duet-lic-name|' + norm(code)), 'AES-GCM', false, ['decrypt']);
      return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, k, raw.slice(12)));
    } catch (err) { return ''; }
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const covers = (a, app) => Array.isArray(a) && (a.includes('*') || a.includes(app));
  const get = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const put = (k, v) => { try { if (v) localStorage.setItem(k, JSON.stringify(v)); else localStorage.removeItem(k); } catch (e) {} };
  // never wait more than 10 s for the list: on a slow school network the screen says so instead of hanging
  async function fetchList() {
    const ac = typeof AbortController !== 'undefined' ? new AbortController() : null; const tm = ac && setTimeout(() => ac.abort(), 10000);
    try { const r = await fetch(LIST + '?t=' + Date.now(), { cache: 'no-store', signal: ac ? ac.signal : undefined }); if (!r.ok) throw new Error('list ' + r.status); return (await r.json()).codes || {}; }
    finally { if (tm) clearTimeout(tm); }
  }
  const fmtDate = (d, L) => { const [y, m, dd] = d.split('-').map(Number); return new Date(y, m - 1, dd).toLocaleDateString(L === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };

  const S = {
    title: { en: 'Enter your DUET STEM school code', hi: 'अपना DUET STEM विद्यालय कोड डालिए', hg: 'Apna DUET STEM school code daaliye' },
    sub: { en: 'Your school gets this code from DUET STEM. The internet is needed once, to activate it.', hi: 'यह कोड आपके विद्यालय को DUET STEM से मिलता है। चालू करने के लिए केवल एक बार इंटरनेट चाहिए।', hg: 'Yeh code aapke school ko DUET STEM se milta hai. Chalu karne ke liye sirf ek baar internet chahiye.' },
    locked: { en: "This part is in the full version. Enter your school's code to open it, or go back to the free demo.", hi: 'यह भाग पूरे संस्करण में है। इसे खोलने के लिए विद्यालय का कोड डालिए, या मुफ़्त डेमो पर लौटिए।', hg: 'Yeh hissa full version mein hai. Kholne ke liye school ka code daaliye, ya free demo par wapas jaaiye.' },
    btn: { en: 'Activate', hi: 'चालू करें', hg: 'Activate karein' },
    del: { en: 'Delete', hi: 'मिटाएँ', hg: 'Delete' },
    clr: { en: 'Clear', hi: 'साफ़ करें', hg: 'Clear' },
    wait: { en: 'Checking the code…', hi: 'कोड जाँचा जा रहा है…', hg: 'Code check ho raha hai…' },
    short: { en: 'Type all 12 letters and numbers of the code.', hi: 'कोड के सभी 12 अक्षर और अंक लिखिए।', hg: 'Code ke saare 12 letters aur numbers likhiye.' },
    bad: { en: 'This code is not valid. Please check it and try again.', hi: 'यह कोड मान्य नहीं है। कृपया जाँचकर फिर से डालिए।', hg: 'Yeh code valid nahi hai. Check karke dobara daaliye.' },
    app: { en: 'This code does not include this app.', hi: 'यह कोड इस ऐप के लिए नहीं है।', hg: 'Yeh code is app ke liye nahi hai.' },
    exp: { en: 'This subscription ended on {d}. Please renew it with DUET STEM.', hi: 'यह सदस्यता {d} को समाप्त हो गई। कृपया DUET STEM से नवीनीकरण कराइए।', hg: 'Yeh subscription {d} ko khatam ho gaya. DUET STEM se renew karaiye.' },
    net: { en: 'No internet. Connect to Wi-Fi once to activate the code.', hi: 'इंटरनेट नहीं है। कोड चालू करने के लिए एक बार Wi-Fi से जुड़िए।', hg: 'Internet nahi hai. Code chalu karne ke liye ek baar Wi-Fi se judiye.' },
    ok: { en: 'Activated{n} · valid until {d}', hi: 'चालू हो गया{n} · {d} तक मान्य', hg: 'Activate ho gaya{n} · {d} tak valid' },
    demo: { en: 'Try the free demo', hi: 'मुफ़्त डेमो आज़माइए', hg: 'Free demo try kijiye' },
    back: { en: '‹ Back to the free demo', hi: '‹ मुफ़्त डेमो पर लौटिए', hg: '‹ Free demo par wapas' },
    help: { en: 'Help or a complaint? Write to info@duetpower.in', hi: 'सहायता या शिकायत? info@duetpower.in पर लिखिए', hg: 'Help ya complaint? info@duetpower.in par likhiye' },
    point: { en: 'Point at a key and pull the trigger (or pinch) to type', hi: 'किसी कुंजी पर पॉइंट करके ट्रिगर दबाइए (या चुटकी लीजिए)', hg: 'Key par point karke trigger dabaiye (ya pinch kijiye)' },
  };

  const licensedFor = (app) => { const v = get(KEY); return !!(v && covers(v.a, app) && v.u >= today()); };
  const G = window.DuetGate = {
    active: false, state: '', mode: 'start', app: '', o: {}, vr: null,
    licensedFor,
    licence() { const v = get(KEY); return v && covers(v.a, this.app) && v.u >= today() ? { until: v.u, name: v.n || '' } : null; },
    init(o) {
      this.o = o || {}; this.app = this.o.app; this.lang = () => { try { const l = this.o.lang && this.o.lang(); return S.title[l] ? l : 'en'; } catch (e) { return 'en'; } };
      if (this.licence()) { this.state = 'ok'; this.recheck(); return; }
      this.state = 'need'; this.watchSessions();
      const show = () => { if (this.state === 'need' && !this.active) this.open('start'); };
      if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
    },
    // may the app open this? (a school code opens everything; without one only the free part)
    allow(free) {
      if (this.state === 'ok' || free) return true;
      if (this.active && this.mode === 'start') return false; // the first screen is already up
      this.open('locked'); return false;
    },
    // online, a saved code is looked at again (renewed, changed or withdrawn); offline the app carries on
    recheck() {
      const have = get(KEY); if (!have) return;
      fetchList().then((list) => {
        const e = list[have.h];
        if (!e || e.r) { put(KEY, null); location.reload(); return; }
        if (e.u !== have.u || JSON.stringify(e.a) !== JSON.stringify(have.a)) { put(KEY, { ...have, u: e.u, a: e.a, t: Date.now() }); if (e.u < today() || !covers(e.a, this.app)) location.reload(); }
      }).catch(() => {});
    },
    async check(code) {
      if (norm(code).length < 12) return { ok: false, key: 'short' };
      let list; try { list = await fetchList(); } catch (err) { return { ok: false, key: 'net' }; }
      const h = await codeHash(code); const e = list[h];
      if (!e || e.r) return { ok: false, key: 'bad' };
      if (!covers(e.a, this.app)) return { ok: false, key: 'app' };
      if (e.u < today()) return { ok: false, key: 'exp', d: e.u };
      const name = e.e ? await openName(code, e.e) : '';
      put(KEY, { h, u: e.u, a: e.a, n: name, t: Date.now() });
      return { ok: true, until: e.u, name };
    },
    t(key, d = {}) { const L = this.lang(); const o = S[key]; return o ? (o[L] || o.en).replace('{d}', d.d ? fmtDate(d.d, L) : '').replace('{n}', d.n || '').replace('{m}', d.m ?? '') : ''; },
    msgFor(r) { return r.ok ? this.t('ok', { n: r.name ? ' · ' + r.name : '', d: r.until }) : this.t(r.key, { d: r.d }); },
    presenting() { return !!(this.vr && this.vr.renderer.xr.isPresenting); },
    open(mode) {
      if (this.state === 'ok') return;
      this.mode = mode || (this.state === 'need' ? 'start' : 'locked'); this.active = true;
      if (this.presenting()) { this.hideDom(); this.vrShow(); return; }
      const s = this.session; if (s && !s.__duetEnded) { try { s.end(); } catch (e) {} } // a headset view this code screen can't draw in
      this.domShow();
    },
    close() { this.active = false; this.hideDom(); this.vrHide(); if (this.o.onChange) try { this.o.onChange(this.state); } catch (e) {} },
    startDemo() { this.state = 'demo'; this.close(); },
    done(r) { this.state = 'ok'; setTimeout(() => this.close(), 1500); },
    // a headset view started by the page while the code screen is up: show the screen there (or, with no panel, stop it)
    watchSessions() {
      if (!navigator.xr || navigator.xr.__duetWrapped) return;
      const req = navigator.xr.requestSession.bind(navigator.xr);
      navigator.xr.requestSession = async (...a) => {
        const s = await req(...a); this.session = s; s.addEventListener('end', () => { s.__duetEnded = true; });
        return s;
      };
      navigator.xr.__duetWrapped = true;
    },

    // ---------------------------------------------------------------- the page screen
    domShow() {
      if (!document.body) return;
      let el = document.getElementById('duet-gate');
      if (!el) {
        el = document.createElement('div'); el.id = 'duet-gate';
        el.innerHTML = `<style>
#duet-gate{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(ellipse at 50% 20%,#1b2436,#0c111b 70%);display:flex;align-items:center;justify-content:center;font:15px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#f3eee6;padding:16px;box-sizing:border-box}
#duet-gate .bx{width:min(560px,100%);background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:28px 26px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.5)}
#duet-gate img{height:42px;margin-bottom:6px}#duet-gate .ap{color:#9aa6b8;font-size:13px;letter-spacing:.04em;text-transform:uppercase}
#duet-gate h1{font-size:23px;margin:10px 0 6px;font-weight:800}#duet-gate p{color:#b9c1cf;font-size:14.5px;margin:0 0 16px}
#duet-gate input{width:100%;box-sizing:border-box;font-size:24px;letter-spacing:.08em;text-align:center;padding:14px 12px;border-radius:14px;border:2px solid rgba(255,255,255,.18);background:#0b0f17;color:#fff;text-transform:uppercase;outline:none}
#duet-gate input:focus{border-color:#f0a65a}#duet-gate .go{margin-top:12px;width:100%;padding:14px;border-radius:14px;border:0;background:#f0a65a;color:#14100a;font-size:18px;font-weight:800;cursor:pointer}
#duet-gate .go:disabled{opacity:.6}#duet-gate .m{min-height:22px;margin-top:12px;font-size:14.5px;font-weight:600}#duet-gate .m.e{color:#ff9b8a}#duet-gate .m.k{color:#9fd17a}
#duet-gate .alt{margin-top:10px;width:100%;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#e6ecf5;font-size:15.5px;font-weight:700;cursor:pointer}#duet-gate .alt small{display:block;font-weight:500;color:#9aa6b8;font-size:12.5px;margin-top:3px}
#duet-gate .hp{display:block;margin-top:14px;color:#9aa6b8;font-size:13px;text-decoration:none}#duet-gate .hp:hover{color:#f0a65a}
</style><div class="bx"><img src="${LOGO}" alt="DUET STEM"><div class="ap"></div><h1></h1><p></p>
<input autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="DUET-XXXX-XXXX-XXXX" maxlength="24"><button class="go"></button><div class="m"></div><button class="alt"></button><a class="hp" target="_blank" rel="noopener" href="${HELP}"></a></div>`;
        document.body.appendChild(el);
        const $ = (s) => el.querySelector(s);
        const go = async () => {
          $('.go').disabled = true; this.domMsg(this.t('wait'), '');
          const r = await this.check($('input').value); $('.go').disabled = false;
          this.domMsg(this.msgFor(r), r.ok ? 'k' : 'e'); if (r.ok) this.done(r);
        };
        $('.go').onclick = go; $('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
        $('.alt').onclick = () => this.startDemo();
      }
      const $ = (s) => el.querySelector(s);
      $('.ap').textContent = this.o.title || ''; $('h1').textContent = this.t('title'); $('p').textContent = this.mode === 'locked' ? this.t('locked') : this.t('sub');
      $('.go').textContent = this.t('btn'); $('.hp').textContent = this.t('help');
      const dd = this.demoDesc(); $('.alt').innerHTML = ''; $('.alt').append(this.mode === 'locked' ? this.t('back') : this.t('demo'));
      if (this.mode !== 'locked' && dd) { const sm = document.createElement('small'); sm.textContent = dd; $('.alt').append(sm); }
      this.domMsg('', ''); el.style.display = 'flex';
      setTimeout(() => { try { $('input').focus(); } catch (e) {} }, 300);
    },
    demoDesc() { const d = this.o.demo; if (!d) return ''; return d[this.lang()] || d.en || ''; },
    domMsg(t, c) { const m = document.querySelector('#duet-gate .m'); if (m) { m.textContent = t; m.className = 'm ' + c; } },
    hideDom() { const el = document.getElementById('duet-gate'); if (el) el.style.display = 'none'; },

    // ---------------------------------------------------------------- the headset screen
    attachVR(v) {
      if (!v || !v.THREE || !v.renderer) return;
      const T = v.THREE, W = 1000, H = 930, PW = 0.9;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      const tex = new T.CanvasTexture(c); if (T.SRGBColorSpace && 'colorSpace' in tex) tex.colorSpace = T.SRGBColorSpace; else if (T.sRGBEncoding) tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
      const mat = (o) => new T.MeshBasicMaterial(Object.assign({ transparent: true, depthTest: false, depthWrite: false }, o));
      const panel = new T.Mesh(new T.PlaneGeometry(PW, PW * H / W), mat({ map: tex }));
      panel.renderOrder = 9999; panel.frustumCulled = false;
      const dim = new T.Mesh(new T.SphereGeometry(4, 24, 16), mat({ color: 0x05070c, opacity: 0.72, side: T.BackSide }));
      dim.renderOrder = 9990; dim.frustumCulled = false;
      const group = new T.Group(); group.add(dim, panel); group.visible = false;
      const logo = new Image(); logo.onload = () => { if (this.vr) this.vr.dirty = true; }; logo.src = LOGO;
      const rayGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), new T.Vector3(0, 0, -1)]);
      const ctl = [0, 1].map((i) => {
        const cc = v.renderer.xr.getController(i);
        const ln = new T.Line(rayGeo, new T.LineBasicMaterial({ color: 0xf0a65a, transparent: true, opacity: 0.95, depthTest: false }));
        ln.scale.z = 3; ln.renderOrder = 10000; ln.visible = false; ln.frustumCulled = false; cc.add(ln);
        cc.addEventListener('connected', (e) => { cc.userData.duetSrc = e.data; });
        cc.addEventListener('selectstart', () => { if (this.active && this.presenting()) this.vrPress(cc); });
        return { c: cc, ln };
      });
      this.vr = { T, renderer: v.renderer, scene: v.scene, parent: v.parent, camera: v.camera, W, H, c, x, tex, panel, dim, group, logo, ctl, rc: new T.Raycaster(), btns: [], hover: '', code: '', msg: '', cls: '', dirty: true, placed: false,
        v1: new T.Vector3(), v2: new T.Vector3(), q: new T.Quaternion(), m: new T.Matrix4() };
      v.renderer.xr.addEventListener('sessionstart', () => {
        this.session = v.renderer.xr.getSession();
        if (this.state === 'need' || this.active) { if (!this.active) this.mode = 'start'; this.active = true; this.hideDom(); setTimeout(() => this.vrShow(), 200); }
      });
      v.renderer.xr.addEventListener('sessionend', () => { this.vrHide(true); if (this.active) this.domShow(); });
      if (this.active && this.presenting()) this.vrShow();
    },
    vrShow() {
      const V = this.vr; if (!V) return;
      const parent = V.parent || V.ctl[0].c.parent || V.scene; if (V.group.parent !== parent) parent.add(V.group);
      V.group.visible = true; V.placed = false; V.code = ''; V.msg = ''; V.cls = ''; V.dirty = true;
      V.ctl.forEach((k) => { k.ln.visible = true; });
      const s = V.renderer.xr.getSession(); if (!s || V.loop === s) return; V.loop = s;
      const tick = () => { if (!V.group.visible || V.renderer.xr.getSession() !== s) { V.loop = null; return; } this.vrFrame(); s.requestAnimationFrame(tick); };
      s.requestAnimationFrame(tick);
    },
    vrHide() { const V = this.vr; if (!V) return; V.group.visible = false; V.ctl.forEach((k) => { k.ln.visible = false; }); V.loop = null; },
    vrFrame() {
      const V = this.vr, T = V.T;
      // keep the panel about a metre in front of the eyes, upright, facing them
      // the eyes: the app's own camera follows the headset once it has been drawn (older and newer three.js alike)
      let cam = V.camera; if (!cam) { try { cam = V.renderer.xr.getCamera(); } catch (e) { return; } }
      const parent = V.group.parent; if (!parent || !cam) return;
      parent.updateMatrixWorld(); const head = cam.getWorldPosition(V.v1); parent.worldToLocal(head);
      const fwd = cam.getWorldDirection(V.v2); V.q.copy(parent.getWorldQuaternion(new T.Quaternion())).invert(); fwd.applyQuaternion(V.q); fwd.y = 0;
      if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1); fwd.normalize();
      const target = head.clone().addScaledVector(fwd, 1.0); target.y = head.y - 0.12;
      if (!V.placed || V.panel.position.distanceTo(target) > 0.55) { V.panel.position.copy(target); V.panel.lookAt(head.x, target.y, head.z); V.placed = true; }
      V.dim.position.copy(head);
      // hover
      let hv = ''; for (const k of V.ctl) { const id = this.vrHit(k.c); if (id) hv = id; }
      if (hv !== V.hover) { V.hover = hv; V.dirty = true; }
      if (V.dirty) this.vrDraw();
    },
    vrHit(cc) {
      const V = this.vr; if (!cc.visible) return '';
      V.group.updateMatrixWorld(); V.m.identity().extractRotation(cc.matrixWorld);
      V.rc.ray.origin.setFromMatrixPosition(cc.matrixWorld); V.rc.ray.direction.set(0, 0, -1).applyMatrix4(V.m);
      const h = V.rc.intersectObject(V.panel, false)[0]; if (!h || !h.uv) return '';
      const px = h.uv.x * V.W, py = (1 - h.uv.y) * V.H;
      const b = V.btns.find((q) => !q.off && px >= q.x && px <= q.x + q.w && py >= q.y && py <= q.y + q.h);
      return b ? b.id : '';
    },
    vrPress(cc) {
      const id = this.vrHit(cc); if (!id) return;
      const src = cc.userData.duetSrc; try { const a = src && src.gamepad && src.gamepad.hapticActuators && src.gamepad.hapticActuators[0]; if (a && a.pulse) a.pulse(0.35, 25); } catch (e) {}
      this.vrKey(id);
    },
    async vrKey(id) {
      const V = this.vr; if (!V || V.busy) return;
      if (id === 'del') V.code = V.code.slice(0, -1);
      else if (id === 'clr') V.code = '';
      else if (id === 'demo') { this.startDemo(); return; }
      else if (id === 'go') {
        if (V.code.length < 12) { V.msg = this.t('short'); V.cls = 'e'; V.dirty = true; return; }
        V.busy = true; V.msg = this.t('wait'); V.cls = ''; V.dirty = true;
        const r = await this.check(V.code); V.busy = false;
        V.msg = this.msgFor(r); V.cls = r.ok ? 'k' : 'e'; V.dirty = true;
        if (r.ok) this.done(r);
        return;
      } else if (id.startsWith('k_') && V.code.length < 12) V.code += id.slice(2);
      V.msg = ''; V.dirty = true;
    },
    vrDraw() {
      const V = this.vr, x = V.x, W = V.W, H = V.H; V.dirty = false; V.btns = [];
      const F = (w, s) => `${w} ${s}px system-ui, "Noto Sans", "Noto Sans Devanagari", Roboto, sans-serif`;
      x.clearRect(0, 0, W, H);
      x.fillStyle = 'rgba(16,21,32,0.97)'; x.beginPath(); x.roundRect(0, 0, W, H, 34); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.14)'; x.lineWidth = 3; x.stroke();
      if (V.logo.complete && V.logo.naturalWidth) { const h = 40, w = h * V.logo.naturalWidth / V.logo.naturalHeight; x.drawImage(V.logo, 40, 30, w, h); }
      x.fillStyle = '#9aa6b8'; x.font = F(600, 24); x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText(this.o.title || '', W - 40, 50);
      x.textAlign = 'center'; x.fillStyle = '#f3eee6'; x.font = F(800, 38); x.fillText(this.t('title'), W / 2, 122);
      x.fillStyle = '#b9c1cf'; x.font = F(500, 23);
      const sub = this.mode === 'locked' ? this.t('locked') : this.t('sub'); const lines = []; let cur = '';
      for (const w of sub.split(' ')) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > W - 120 && cur) { lines.push(cur); cur = w; } else cur = t; } lines.push(cur);
      lines.slice(0, 2).forEach((l, i) => x.fillText(l, W / 2, 170 + i * 30));
      // the code typed so far
      x.fillStyle = '#0b0f17'; x.beginPath(); x.roundRect(130, 222, W - 260, 82, 18); x.fill(); x.strokeStyle = '#f0a65a'; x.lineWidth = 3; x.stroke();
      const g = (V.code + '____________').slice(0, 12); const shown = 'DUET-' + g.slice(0, 4) + '-' + g.slice(4, 8) + '-' + g.slice(8, 12);
      x.font = F(700, 44); const total = x.measureText(shown).width; let px = W / 2 - total / 2; x.textAlign = 'left';
      for (let i = 0; i < shown.length; i++) { const ch = shown[i]; const typed = i < 5 || (ch !== '_' && ch !== '-'); x.fillStyle = ch === '_' ? 'rgba(255,255,255,0.25)' : typed ? '#ffffff' : 'rgba(255,255,255,0.45)'; x.fillText(ch, px, 264); px += x.measureText(ch).width; }
      x.textAlign = 'center';
      x.font = F(600, 24); x.fillStyle = V.cls === 'e' ? '#ff9b8a' : V.cls === 'k' ? '#9fd17a' : '#9aa6b8'; x.fillText(V.msg || this.t('point'), W / 2, 335);
      const btn = (id, bx, by, bw, bh, label, o = {}) => {
        const hov = V.hover === id && !o.off;
        x.fillStyle = o.off ? 'rgba(255,255,255,0.03)' : o.primary ? (hov ? '#ffbf7a' : '#f0a65a') : hov ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)';
        x.beginPath(); x.roundRect(bx, by, bw, bh, 14); x.fill();
        if (hov) { x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 3; x.stroke(); }
        x.fillStyle = o.off ? 'rgba(255,255,255,0.3)' : o.primary ? '#14100a' : '#eef2f7'; x.font = F(o.small ? 600 : 700, o.small ? 24 : 32); x.fillText(label, bx + bw / 2, by + bh / 2 + 1);
        V.btns.push({ id, x: bx, y: by, w: bw, h: bh, off: !!o.off });
      };
      const kw = 104, kh = 70, gap = 10, x0 = (W - (8 * kw + 7 * gap)) / 2;
      [...ALPHA].forEach((ch, i) => btn('k_' + ch, x0 + (i % 8) * (kw + gap), 368 + Math.floor(i / 8) * (kh + gap), kw, kh, ch));
      const by = 368 + 4 * (kh + gap) + 4, full = 8 * kw + 7 * gap;
      btn('del', x0, by, 210, 70, '⌫ ' + this.t('del'), { small: true });
      btn('clr', x0 + 220, by, 200, 70, this.t('clr'), { small: true });
      btn('go', x0 + 430, by, full - 430, 70, this.t('btn') + ' ✓', { primary: true });
      const dd = this.demoDesc();
      btn('demo', x0, by + 82, full, 62, this.mode === 'locked' ? this.t('back') : this.t('demo') + (dd ? ' · ' + dd : ''), { small: true });
      x.font = F(500, 21); x.fillStyle = '#8c97a8'; x.fillText(this.t('help'), W / 2, by + 82 + 62 + 34);
      V.tex.needsUpdate = true;
    },
  };
})();
