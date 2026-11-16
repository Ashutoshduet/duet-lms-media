"""Pages on a DUET STEM pen drive: the home page, the teacher guide, the Android page, CODE.txt and the start
scripts for Linux and macOS. Used by build_pendrive.py."""
import html, json, os

E = html.escape

# the apps on a drive, in the order of the home page: devtools/pendrive/apps.json (one line per app; a new app such
# as Robotics Lab 360 is one more line there and its folder in the repo)
APPS = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'apps.json'), encoding='utf-8'))
BY_ID = {a['id']: a for a in APPS}

FONTS = """@font-face{font-family:"Noto Sans Devanagari";font-weight:400;font-display:swap;src:url(science/fonts/nsd-latin-400.woff2) format("woff2");unicode-range:U+0000-00FF,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212}
@font-face{font-family:"Noto Sans Devanagari";font-weight:700;font-display:swap;src:url(science/fonts/nsd-latin-700.woff2) format("woff2");unicode-range:U+0000-00FF,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212}
@font-face{font-family:"Noto Sans Devanagari";font-weight:400;font-display:swap;src:url(science/fonts/nsd-deva-400.woff2) format("woff2");unicode-range:U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}
@font-face{font-family:"Noto Sans Devanagari";font-weight:700;font-display:swap;src:url(science/fonts/nsd-deva-700.woff2) format("woff2");unicode-range:U+0900-097F,U+1CD0-1CF9,U+200C-200D,U+20A8,U+20B9,U+25CC,U+A830-A839,U+A8E0-A8FF}"""


def home(apps):
    tiles = []
    for k in apps:
        if k not in BY_ID: continue
        A = BY_ID[k]; t, th, d, dh, href, cls = A['title'], A.get('hi', A['title']), A.get('about', ''), A.get('about_hi', A.get('about', '')), k + '/index.html', A.get('classes')
        chips = ''
        if cls:
            chips = '<div class="cls"><span data-en="Class" data-hi="कक्षा">Class</span>' + ''.join(
                f'<a class="c" href="{href}?cls={c}" data-href="{href}?cls={c}">{c}</a>' for c in range(6, 11)) + '</div>'
        tiles.append(f'''<div class="tile t-{k}"><a class="main" href="{href}" data-href="{href}"><img src="{k}/icons/icon-512.png" alt="" width="512" height="512">
<span class="tx"><b data-en="{E(t)}" data-hi="{E(th)}">{E(t)}</b><small data-en="{E(d)}" data-hi="{E(dh)}">{E(d)}</small></span></a>{chips}</div>''')
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DUET STEM · Apps</title>
<meta name="theme-color" content="#0a0d13">
<link rel="icon" href="science/icons/icon-192.png">
<style>
{FONTS}
:root{{color-scheme:dark;--bg:#0a0d13;--card:#141a26;--card2:#1b2232;--line:rgba(255,255,255,.12);--ink:#f2ede4;--mute:#a49d90;--acc:#f0a65a;--blue:#7fd1ff}}
*{{box-sizing:border-box}}
html{{font-size:clamp(15px,calc(1vw + .75vh),60px);background:var(--bg)}}
body{{margin:0;min-height:100vh;background:radial-gradient(ellipse at 50% -20%,#1d2638 0,var(--bg) 60%) fixed;color:var(--ink);font-family:"Noto Sans Devanagari",system-ui,sans-serif;-webkit-tap-highlight-color:transparent}}
a{{color:inherit;text-decoration:none}}
button{{font:inherit;color:inherit;border:0;background:none;cursor:pointer}}
.wrap{{max-width:84rem;margin:0 auto;padding:1.2rem 1.6rem 1.4rem;display:flex;flex-direction:column;min-height:100vh}}
header{{display:flex;align-items:center;gap:1rem;flex-wrap:wrap}}
header img{{height:1.6rem;width:auto}}
#school{{color:var(--mute);font-size:.85rem;border-left:1px solid var(--line);padding-left:1rem}}
header .sp{{flex:1}}
.seg{{display:inline-flex;background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:.8rem;padding:.2rem}}
.seg button{{padding:.45rem .9rem;border-radius:.6rem;font-weight:700;font-size:.9rem;color:var(--mute);min-height:2.4rem}}
.seg button.on{{background:var(--ink);color:#12100c}}
h1{{font-size:1.9rem;margin:1.1rem 0 .9rem;letter-spacing:-.01em}}
h1 small{{display:block;font-size:.95rem;color:var(--mute);font-weight:400;margin-top:.2rem;letter-spacing:0}}
.grid{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}}
.tile{{background:linear-gradient(180deg,var(--card2),var(--card));border:1px solid var(--line);border-radius:1.2rem;overflow:hidden;display:flex;flex-direction:column;transition:border-color .15s,transform .15s}}
.tile:hover,.tile:focus-within{{border-color:rgba(240,166,90,.7)}}
.tile:active{{transform:scale(.99)}}
.main{{display:flex;gap:1rem;align-items:center;padding:1rem;flex:1;min-height:7.2rem}}
.main img{{width:5.6rem;height:5.6rem;border-radius:1rem;object-fit:cover;flex:none;box-shadow:0 .4rem 1.2rem rgba(0,0,0,.4)}}
.tx b{{display:block;font-size:1.3rem;line-height:1.2}}
.tx small{{display:block;color:var(--mute);font-size:.86rem;line-height:1.4;margin-top:.3rem}}
.cls{{display:flex;align-items:center;gap:.45rem;padding:0 1rem 1rem;flex-wrap:wrap}}
.cls span{{color:var(--mute);font-size:.8rem;margin-right:.2rem}}
.cls .c{{min-width:2.6rem;height:2.4rem;display:grid;place-items:center;border-radius:.6rem;background:rgba(127,209,255,.12);color:var(--blue);font-weight:700;font-size:1rem}}
.cls .c:hover{{background:var(--blue);color:#0b1520}}
.tile.help{{background:transparent;border-style:dashed}}
.tile.help .main{{flex-direction:column;align-items:flex-start;justify-content:center;gap:.5rem}}
.tile.help b{{font-size:1.15rem}}
.tile.help .main small{{color:var(--mute);font-size:.86rem;line-height:1.4}}
footer{{margin-top:auto;padding-top:1.2rem;display:flex;gap:1rem 2rem;align-items:center;flex-wrap:wrap;color:var(--mute);font-size:.82rem;line-height:1.45}}
footer .keep{{flex:1;min-width:16rem}}
footer .keep b{{color:var(--ink)}}
.mode{{display:flex;align-items:center;gap:.6rem}}
.mode .seg button{{font-size:.8rem;min-height:2.1rem;padding:.35rem .7rem}}
@media (max-width:1100px){{.grid{{grid-template-columns:repeat(2,minmax(0,1fr))}}}}
@media (max-width:640px){{.grid{{grid-template-columns:1fr}}html{{font-size:15px}}.main img{{width:4.4rem;height:4.4rem}}#school{{border:0;padding:0;width:100%}}}}
</style>
</head>
<body>
<div class="wrap">
<header>
  <img src="science/brand/duet-stem-logo-light.png" alt="DUET STEM">
  <span id="school" hidden></span>
  <span class="sp"></span>
  <div class="seg" role="group" aria-label="Language"><button data-l="en">English</button><button data-l="hi">हिंदी</button></div>
</header>
<h1><span data-en="Choose an app" data-hi="ऐप चुनिए">Choose an app</span><small data-en="Everything runs from this pen drive: no internet needed." data-hi="सब कुछ इसी पेन ड्राइव से चलता है: इंटरनेट की ज़रूरत नहीं।">Everything runs from this pen drive: no internet needed.</small></h1>
<main class="grid">
{chr(10).join(tiles)}
<div class="tile help"><a class="main" href="guide.html"><b data-en="Teacher guide" data-hi="शिक्षक गाइड">Teacher guide</b><small data-en="How to start, the teacher tools (pen, bigger text), the school code, and help when something does not work." data-hi="कैसे शुरू करें, शिक्षक के औज़ार (पेन, बड़े अक्षर), विद्यालय कोड, और कुछ न चले तो मदद।">How to start, the teacher tools (pen, bigger text), the school code, and help when something does not work.</small></a></div>
</main>
<footer>
  <div class="keep" data-en="Keep the black &lt;b&gt;DUET STEM&lt;/b&gt; window open while you teach. To finish: close this window, then the black one." data-hi="पढ़ाते समय काली &lt;b&gt;DUET STEM&lt;/b&gt; खिड़की खुली रहने दीजिए। काम पूरा होने पर: पहले यह खिड़की, फिर काली खिड़की बंद कीजिए।">Keep the black <b>DUET STEM</b> window open while you teach. To finish: close this window, then the black one.</div>
  <div class="mode"><span data-en="Teacher mode (big text, pen):" data-hi="शिक्षक मोड (बड़े अक्षर, पेन):">Teacher mode (big text, pen):</span>
    <div class="seg" role="group" id="mode"><button data-m="auto" data-en="Auto" data-hi="अपने आप">Auto</button><button data-m="on" data-en="On" data-hi="चालू">On</button><button data-m="off" data-en="Off" data-hi="बंद">Off</button></div></div>
</footer>
</div>
<script>
(function () {{
  var get = function (k) {{ try {{ return localStorage.getItem(k); }} catch (e) {{ return null; }} }};
  var set = function (k, v) {{ try {{ if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); }} catch (e) {{}} }};
  var L = get('duet.home.lang') || ((navigator.language || '').indexOf('hi') === 0 ? 'hi' : 'en');
  function lang(l) {{
    L = l === 'hi' ? 'hi' : 'en'; set('duet.home.lang', L); document.documentElement.lang = L;
    document.querySelectorAll('[data-en]').forEach(function (el) {{ var t = el.getAttribute('data-' + L); if (el.classList.contains('keep')) el.innerHTML = t; else el.textContent = t; }});
    document.querySelectorAll('[data-l]').forEach(function (b) {{ b.classList.toggle('on', b.getAttribute('data-l') === L); }});
    // Hindi here: the apps open in Hindi (Science, Maths, Human Body); English: each app keeps its own choice
    document.querySelectorAll('[data-href]').forEach(function (a) {{ var h = a.getAttribute('data-href'); if (L === 'hi' && /^(science|maths|body)\\//.test(h)) h += (h.indexOf('?') < 0 ? '?' : '&') + 'lang=hi'; a.setAttribute('href', h); }});
  }}
  document.querySelectorAll('[data-l]').forEach(function (b) {{ b.onclick = function () {{ lang(b.getAttribute('data-l')); }}; }});
  lang(L);
  // teacher mode for all the apps (the same setting as the Teacher button in the apps)
  var KEY = 'duet.board.v1';
  function mode() {{ var p = {{}}; try {{ p = JSON.parse(get(KEY) || '{{}}') || {{}}; }} catch (e) {{}} return p; }}
  function showMode() {{ var p = mode(), m = p.on === true ? 'on' : p.on === false ? 'off' : 'auto'; document.querySelectorAll('[data-m]').forEach(function (b) {{ b.classList.toggle('on', b.getAttribute('data-m') === m); }}); }}
  document.querySelectorAll('[data-m]').forEach(function (b) {{ b.onclick = function () {{ var p = mode(), m = b.getAttribute('data-m'); if (m === 'auto') delete p.on; else p.on = m === 'on'; set(KEY, JSON.stringify(p)); showMode(); }}; }});
  showMode();
  // the school this drive belongs to (only on its own computer)
  if (window.fetch) fetch('school.json', {{ cache: 'no-store' }}).then(function (r) {{ return r.ok ? r.json() : null; }}).then(function (j) {{
    if (j && j.school) {{ var s = document.getElementById('school'); s.textContent = j.school; s.hidden = false; }}
  }}).catch(function () {{}});
}})();
</script>
</body>
</html>
'''


def guide(code, school, until, apps=None):
    apps = [BY_ID[k] for k in (apps or [a['id'] for a in APPS]) if k in BY_ID]
    names_en = ' · '.join(E(a['title']) for a in apps); names_hi = ' · '.join(E(a.get('hi', a['title'])) for a in apps)
    if code:
        codebox = f'''<section class="codebox">
<p class="k">School code · विद्यालय कोड</p>
<p class="code">{E(code)}</p>
{f'<p class="sch">{E(school)}</p>' if school else ''}
{f'<p class="u">Valid until · मान्य: {E(until)}</p>' if until else ''}
<p class="n">Windows / Linux / Mac: the pen drive enters this code by itself. Android panel: type it once in each app.<br>
<span lang="hi">Windows / Linux / Mac पर पेन ड्राइव यह कोड अपने आप डालती है। Android पैनल पर हर ऐप में इसे एक बार लिखिए।</span></p>
<p class="n">Keep this page safe. This pen drive works only on the first computer or panel it is started on.<br>
<span lang="hi">इस पन्ने को सँभालकर रखिए। यह पेन ड्राइव केवल उसी कंप्यूटर या पैनल पर चलती है जिस पर इसे पहली बार चलाया जाए।</span></p>
</section>'''
    else:
        codebox = '''<section class="codebox"><p class="k">Demo pen drive · डेमो पेन ड्राइव</p><p class="n">This drive has no school code: the apps run their free demo, or ask for a DUET STEM code.<br><span lang="hi">इस ड्राइव में विद्यालय कोड नहीं है: ऐप मुफ़्त डेमो चलाते हैं, या DUET STEM कोड माँगते हैं।</span></p></section>'''

    def two(en, hi):
        return f'<div class="two"><div class="en">{en}</div><div class="hi" lang="hi">{hi}</div></div>'

    sections = [
        ('1', 'Start on a Windows computer or panel', 'Windows कंप्यूटर या पैनल पर शुरू करना', two(
            '''<ol><li>Plug the pen drive into the computer, or into the panel's USB port (the panel's Windows PC, "OPS", must be switched on: choose it as the input, often called <b>PC</b> or <b>OPS</b>).</li>
<li>Open the pen drive: <b>File Explorer → This PC → the USB drive</b>.</li>
<li>Double-click <b>START-DUET-STEM</b> (START-DUET-STEM.exe).</li>
<li>A small black window opens. <b>Keep it open</b> while you teach (you may minimise it).</li>
<li>The apps open in Chrome or Edge, already activated. Tap an app.</li>
<li>To finish: close the browser window, then the black window. Then remove the pen drive.</li></ol>
<p class="note">The first time, this computer becomes the pen drive's computer. The drive will not open the apps on any other computer.</p>
<p class="note">Windows 7 or 8, or 32-bit Windows ("This app can't run on your PC"): open the folder <b>DUET-STEM → launcher</b> and double-click <b>START-DUET-STEM-old-Windows</b>.</p>''',
            '''<ol><li>पेन ड्राइव को कंप्यूटर में, या पैनल के USB पोर्ट में लगाइए (पैनल का Windows कंप्यूटर, "OPS", चालू होना चाहिए: इनपुट में <b>PC</b> या <b>OPS</b> चुनिए)।</li>
<li>पेन ड्राइव खोलिए: <b>File Explorer → This PC → USB ड्राइव</b>।</li>
<li><b>START-DUET-STEM</b> पर दो बार क्लिक कीजिए।</li>
<li>एक छोटी काली खिड़की खुलेगी। पढ़ाते समय <b>इसे खुला रहने दीजिए</b> (छोटा कर सकते हैं)।</li>
<li>ऐप Chrome या Edge में खुलेंगे, पहले से चालू। किसी ऐप पर टैप कीजिए।</li>
<li>काम पूरा होने पर: पहले ब्राउज़र की खिड़की, फिर काली खिड़की बंद कीजिए। फिर पेन ड्राइव निकालिए।</li></ol>
<p class="note">पहली बार में यही कंप्यूटर पेन ड्राइव का कंप्यूटर बन जाता है। किसी दूसरे कंप्यूटर पर यह ड्राइव ऐप नहीं खोलेगी।</p>
<p class="note">Windows 7 या 8, या 32-bit Windows ("This app can't run on your PC"): <b>DUET-STEM → launcher</b> फ़ोल्डर खोलकर <b>START-DUET-STEM-old-Windows</b> चलाइए।</p>''')),
        ('2', 'Android panel (no Windows PC in the panel)', 'Android पैनल (पैनल में Windows कंप्यूटर नहीं)', two(
            '''<ol><li>Plug in the pen drive. Open the panel's <b>File Manager</b> (Files, File Explorer or "U Disk") and open the drive.</li>
<li>Open the folder <b>ANDROID</b> and tap an app file, for example <b>DUET-ScienceLab360-….apk</b>.</li>
<li>If the panel asks, allow <b>"Install unknown apps"</b> for the File Manager (Settings opens; switch it on, then go back), then tap <b>Install</b>.</li>
<li>Install the other apps the same way. They work without the internet; they stay on the panel, so the pen drive is not needed afterwards.</li>
<li>Open an app and type the school code from <b>CODE.txt</b> (the first page of this guide) once in each app.</li></ol>
<p class="note">The code works without the internet. The first panel it is typed on keeps it: when that panel is ever online it is registered with DUET STEM, and other devices with the same code are refused.</p>''',
            '''<ol><li>पेन ड्राइव लगाइए। पैनल का <b>File Manager</b> (Files, File Explorer या "U Disk") खोलकर ड्राइव खोलिए।</li>
<li><b>ANDROID</b> फ़ोल्डर खोलिए और किसी ऐप की फ़ाइल पर टैप कीजिए, जैसे <b>DUET-ScienceLab360-….apk</b>।</li>
<li>अगर पैनल पूछे, तो File Manager के लिए <b>"Install unknown apps"</b> चालू कीजिए (सेटिंग खुलेगी; चालू करके वापस आइए), फिर <b>Install</b> दबाइए।</li>
<li>बाकी ऐप भी ऐसे ही इंस्टॉल कीजिए। ये बिना इंटरनेट के चलते हैं और पैनल पर रहते हैं, बाद में पेन ड्राइव की ज़रूरत नहीं।</li>
<li>ऐप खोलकर <b>CODE.txt</b> (इस गाइड के पहले पन्ने) वाला विद्यालय कोड हर ऐप में एक बार लिखिए।</li></ol>
<p class="note">कोड बिना इंटरनेट के चलता है। जिस पैनल पर पहले लिखा जाए, कोड उसी का हो जाता है: वह पैनल जब कभी इंटरनेट से जुड़ेगा, DUET STEM में दर्ज हो जाएगा, और उसी कोड वाले दूसरे डिवाइस मना कर दिए जाएँगे।</p>''')),
        ('3', 'Linux or Mac computer', 'Linux या Mac कंप्यूटर', two(
            '''<p><b>Linux</b> (Ubuntu, BOSS…): open the pen drive, right-click <b>START-DUET-STEM-Linux.sh</b> → <b>Run as a Program</b>. If that is not offered, open a Terminal and type <code>sh </code>, drag the file into the Terminal and press Enter.</p>
<p><b>Mac</b>: double-click <b>START-DUET-STEM-Mac.command</b>. If the Mac refuses, right-click it → <b>Open</b> → <b>Open</b>.</p>
<p class="note">Keep the Terminal window open while you teach.</p>''',
            '''<p><b>Linux</b> (Ubuntu, BOSS…): पेन ड्राइव खोलिए, <b>START-DUET-STEM-Linux.sh</b> पर राइट-क्लिक → <b>Run as a Program</b>। यह न दिखे तो Terminal खोलकर <code>sh </code> लिखिए, फ़ाइल को Terminal में खींचकर छोड़िए और Enter दबाइए।</p>
<p><b>Mac</b>: <b>START-DUET-STEM-Mac.command</b> पर दो बार क्लिक कीजिए। Mac मना करे तो राइट-क्लिक → <b>Open</b> → <b>Open</b>।</p>
<p class="note">पढ़ाते समय Terminal की खिड़की खुली रहने दीजिए।</p>''')),
        ('4', 'Teaching on the big screen: the teacher tools', 'बड़ी स्क्रीन पर पढ़ाना: शिक्षक के औज़ार', two(
            '''<p>On a touch panel the apps show bigger text by themselves and a round <b>Teacher</b> button at the right edge of the screen. On a computer with a projector, tap the small tab on the right edge to turn Teacher mode on.</p>
<ul><li><b>Pen</b>: write or draw over the 3D with a finger or stylus. Choose a colour and <b>Size</b>; <b>Eraser</b>, <b>Undo</b>, <b>Clear</b>. Tap <b>Pen</b> again to use the app (turn and zoom the 3D) — your drawing stays until you clear it.</li>
<li><b>Spotlight</b>: darkens the screen except a circle you drag to what you are explaining.</li>
<li><b>A− / A+</b>: smaller or bigger text and buttons.</li>
<li><b>Full screen</b> / <b>Small screen</b>.</li>
<li><b>All apps</b>: back to the pen drive's home page.</li>
<li><b>Close</b>: hides the tools (the round Teacher button stays). <b>Teacher mode off</b>: normal size, no tools.</li></ul>
<p class="note">Drag the toolbar by its top bar to move it. On the home page, "Teacher mode" can be set to Auto, On or Off for all apps.</p>''',
            '''<p>टच पैनल पर ऐप अपने आप बड़े अक्षर और स्क्रीन के दाएँ किनारे पर गोल <b>Teacher</b> बटन दिखाते हैं। प्रोजेक्टर वाले कंप्यूटर पर दाएँ किनारे का छोटा टैब दबाकर शिक्षक मोड चालू कीजिए।</p>
<ul><li><b>पेन</b>: उँगली या स्टाइलस से 3D के ऊपर लिखिए या चित्र बनाइए। रंग और <b>मोटाई</b> चुनिए; <b>रबर</b>, <b>वापस</b>, <b>सब मिटाएँ</b>। ऐप चलाने (3D घुमाने) के लिए <b>पेन</b> फिर दबाइए — लिखा हुआ मिटाने तक बना रहता है।</li>
<li><b>रोशनी</b> (Spotlight): पूरी स्क्रीन धुंधली, सिर्फ़ एक गोला रोशन, जिसे आप समझाई जा रही चीज़ पर खींच सकते हैं।</li>
<li><b>A− / A+</b>: छोटे या बड़े अक्षर और बटन।</li>
<li><b>पूरी स्क्रीन</b> / <b>छोटी स्क्रीन</b>।</li>
<li><b>सभी ऐप</b>: पेन ड्राइव के मुख्य पन्ने पर वापस।</li>
<li><b>बंद</b>: औज़ार छिपाता है (गोल Teacher बटन रहता है)। <b>शिक्षक मोड बंद</b>: सामान्य आकार, कोई औज़ार नहीं।</li></ul>
<p class="note">टूलबार को ऊपर की पट्टी से खींचकर कहीं भी रखिए। मुख्य पन्ने पर "Teacher mode" सभी ऐप के लिए अपने आप / चालू / बंद किया जा सकता है।</p>''')),
        ('5', 'The school code', 'विद्यालय कोड', two(
            '''<p>On the pen drive's own computer the apps activate by themselves: nobody types the code. If a code screen appears anyway, type the code from the first page and tap <b>Activate</b> (or tap <b>Try the free demo</b>).</p>
<p>The code shows the school's name and its end date. Before it ends, DUET STEM renews it.</p>''',
            '''<p>पेन ड्राइव के अपने कंप्यूटर पर ऐप अपने आप चालू होते हैं: कोड लिखना नहीं पड़ता। फिर भी कोड वाली स्क्रीन आए तो पहले पन्ने का कोड लिखकर <b>Activate / चालू करें</b> दबाइए (या <b>मुफ़्त डेमो</b> चलाइए)।</p>
<p>कोड में विद्यालय का नाम और समाप्ति की तारीख़ होती है। समाप्त होने से पहले DUET STEM उसे नवीनीकृत करता है।</p>''')),
        ('6', 'When something does not work', 'जब कुछ काम न करे', two(
            '''<dl>
<dt>The page says "This pen drive is activated on another computer"</dt><dd>The drive works only on its first computer or panel. Use it there, or contact DUET STEM.</dd>
<dt>"This site can't be reached" / the apps stopped</dt><dd>The black window was closed. Double-click START-DUET-STEM again.</dd>
<dt>Nothing happens when I double-click START-DUET-STEM</dt><dd>Wait 10 seconds (a pen drive can be slow). Check that the antivirus did not block it; allow it. Copy-paste or unzip is not needed: run it from the drive.</dd>
<dt>"Windows protected your PC"</dt><dd>Tap <b>More info → Run anyway</b>.</dd>
<dt>The 3D is slow or jerky</dt><dd>Close other programs. Use Chrome or Edge. On a 4K panel, Windows display scaling of 200% or more helps.</dd>
<dt>Text is too small or too big</dt><dd>Teacher button → <b>A+</b> or <b>A−</b>.</dd>
<dt>I cannot turn the 3D model</dt><dd>The pen is on: tap <b>Pen</b> to turn it off.</dd>
<dt>No sound</dt><dd>Tap once on the app (browsers play sound only after a tap); check the panel's volume and the speaker button in the app.</dd>
<dt>Android: "App not installed"</dt><dd>Free some space on the panel, or uninstall an older DUET app first.</dd>
</dl>
<p class="note">Do not delete, rename or move files on the pen drive. Help: <b>info@duetpower.in</b></p>''',
            '''<dl>
<dt>पन्ना कहे "This pen drive is activated on another computer"</dt><dd>ड्राइव केवल अपने पहले कंप्यूटर या पैनल पर चलती है। वहीं इस्तेमाल कीजिए, या DUET STEM से संपर्क कीजिए।</dd>
<dt>"This site can't be reached" / ऐप रुक गए</dt><dd>काली खिड़की बंद हो गई है। START-DUET-STEM फिर से चलाइए।</dd>
<dt>START-DUET-STEM दबाने पर कुछ नहीं होता</dt><dd>10 सेकंड रुकिए (पेन ड्राइव धीमी हो सकती है)। देखिए कि एंटीवायरस ने रोका तो नहीं; अनुमति दीजिए। इसे सीधे पेन ड्राइव से चलाइए।</dd>
<dt>"Windows protected your PC"</dt><dd><b>More info → Run anyway</b> दबाइए।</dd>
<dt>3D धीमा या रुक-रुककर चलता है</dt><dd>दूसरे प्रोग्राम बंद कीजिए। Chrome या Edge इस्तेमाल कीजिए। 4K पैनल पर Windows की display scaling 200% या ज़्यादा रखिए।</dd>
<dt>अक्षर बहुत छोटे या बड़े हैं</dt><dd>Teacher बटन → <b>A+</b> या <b>A−</b>।</dd>
<dt>3D मॉडल घूमता नहीं</dt><dd>पेन चालू है: <b>पेन</b> दबाकर बंद कीजिए।</dd>
<dt>आवाज़ नहीं आती</dt><dd>ऐप पर एक बार टैप कीजिए (ब्राउज़र टैप के बाद ही आवाज़ चलाते हैं); पैनल की आवाज़ और ऐप का स्पीकर बटन देखिए।</dd>
<dt>Android: "App not installed"</dt><dd>पैनल पर थोड़ी जगह खाली कीजिए, या पुराना DUET ऐप पहले हटाइए।</dd>
</dl>
<p class="note">पेन ड्राइव की फ़ाइलें न मिटाइए, न नाम बदलिए, न हटाइए। मदद: <b>info@duetpower.in</b></p>''')),
    ]
    body = ''.join(f'<section class="sec"><h2><span class="n">{n}</span>{E(t)}<small lang="hi">{E(th)}</small></h2>{c}</section>' for n, t, th, c in sections)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DUET STEM · Teacher guide</title>
<style>
:root{{color-scheme:light;--ink:#1d1b18;--mute:#6a6359;--line:#e4ddd0;--acc:#c46a12;--bg:#fbf8f2}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 "Noto Sans Devanagari","Nirmala UI","Mangal","Noto Sans",system-ui,sans-serif}}
.page{{max-width:1080px;margin:0 auto;padding:28px 24px 60px}}
.top{{display:flex;align-items:baseline;gap:16px;flex-wrap:wrap;border-bottom:3px solid var(--acc);padding-bottom:10px}}
.top h1{{margin:0;font-size:30px}}.top p{{margin:0;color:var(--mute)}}
.codebox{{margin:22px 0 10px;padding:22px 26px;border:2px solid var(--acc);border-radius:16px;background:#fff}}
.codebox .k{{margin:0;color:var(--mute);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:13px}}
.codebox .code{{margin:6px 0;font:700 44px/1.15 ui-monospace,"Cascadia Mono",Consolas,monospace;letter-spacing:.06em;word-break:break-all}}
.codebox .sch{{margin:0;font-size:22px;font-weight:700}}.codebox .u{{margin:2px 0 8px;color:var(--mute)}}
.codebox .n{{margin:8px 0 0;font-size:15px}}
.sec{{margin-top:30px;break-inside:avoid-page}}
h2{{font-size:23px;margin:0 0 10px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}}
h2 .n{{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--acc);color:#fff;font-size:18px;flex:none}}
h2 small{{font-size:18px;color:var(--mute);font-weight:600}}
.two{{display:grid;grid-template-columns:1fr 1fr;gap:26px}}
.two>div{{background:#fff;border:1px solid var(--line);border-radius:14px;padding:6px 20px}}
ol,ul{{padding-left:22px}}li{{margin:6px 0}}
.note{{color:var(--mute);font-size:15px}}
dt{{font-weight:700;margin-top:10px}}dd{{margin:2px 0 0 0;color:#3a362f}}
code{{background:#f1ece2;padding:1px 6px;border-radius:5px}}
footer{{margin-top:36px;color:var(--mute);font-size:14px;border-top:1px solid var(--line);padding-top:10px}}
@media (max-width:820px){{.two{{grid-template-columns:1fr}}.codebox .code{{font-size:30px}}}}
@media print{{body{{background:#fff;font-size:12pt}}.page{{padding:0}}.codebox{{break-after:page}}.two>div{{border:0;padding:0}}}}
</style>
</head>
<body><div class="page">
<div class="top"><h1>DUET STEM pen drive · Teacher guide</h1><p lang="hi">DUET STEM पेन ड्राइव · शिक्षक गाइड</p></div>
{codebox}
<p>{names_en} — 3D apps for classroom panels, projectors and computers, without the internet.<br>
<span lang="hi">{names_hi} — कक्षा के पैनल, प्रोजेक्टर और कंप्यूटर के लिए 3D ऐप, बिना इंटरनेट के।</span></p>
{body}
<footer>DUET STEM · info@duetpower.in · www.duetpower.in</footer>
</div></body></html>
'''


def android(apks, code, school):
    names = {a['apk']: (a['title'], a.get('hi', '')) for a in APPS if a.get('apk')}
    rows = ''
    for f in apks:
        k = f.split('-')[1] if f.count('-') >= 2 else f
        en, hi = names.get(k, (k, ''))
        rows += f'<li><b>{E(en)}</b> <span lang="hi">{E(hi)}</span><br><a href="{E(f)}"><code>{E(f)}</code></a></li>'
    cb = f'<div class="code"><small>School code · विद्यालय कोड</small><b>{E(code)}</b>{f"<span>{E(school)}</span>" if school else ""}</div>' if code else ''
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>DUET STEM · Android apps</title>
<style>
body{{margin:0;background:#0c111b;color:#f2ede4;font:19px/1.55 "Noto Sans Devanagari","Noto Sans",system-ui,sans-serif}}
.p{{max-width:900px;margin:0 auto;padding:26px 22px 50px}}h1{{font-size:30px;margin:0 0 4px}}h2{{color:#f0a65a;font-size:22px;margin:26px 0 6px}}
ol{{padding-left:24px}}li{{margin:8px 0}}code{{color:#7fd1ff;font-size:16px}}.m{{color:#a49d90;font-size:16px}}
.code{{margin:18px 0;padding:16px 20px;border:2px solid #f0a65a;border-radius:14px}}.code small{{display:block;color:#a49d90}}.code b{{display:block;font:700 34px/1.2 ui-monospace,Consolas,monospace;letter-spacing:.05em}}.code span{{color:#a49d90}}
</style></head><body><div class="p">
<h1>DUET STEM Android apps</h1><p class="m" lang="hi">DUET STEM के Android ऐप</p>
{cb}
<h2>Install · इंस्टॉल कीजिए</h2>
<ol><li>In the panel's File Manager, tap an app file below (in this ANDROID folder).<br><span lang="hi">पैनल के File Manager में नीचे दी गई किसी ऐप फ़ाइल पर टैप कीजिए (इसी ANDROID फ़ोल्डर में)।</span></li>
<li>If asked, allow <b>Install unknown apps</b> for the File Manager, go back, and tap <b>Install</b>.<br><span lang="hi">पूछे जाने पर File Manager के लिए <b>Install unknown apps</b> चालू कीजिए, वापस आइए, और <b>Install</b> दबाइए।</span></li>
<li>Open the app and type the school code once. It works without the internet.<br><span lang="hi">ऐप खोलकर विद्यालय कोड एक बार लिखिए। यह बिना इंटरनेट के चलता है।</span></li></ol>
<p class="m">The code belongs to the first device it is typed on; when that device is ever online it is registered with DUET STEM.<br><span lang="hi">कोड उसी डिवाइस का हो जाता है जिस पर पहले लिखा जाए; वह डिवाइस जब कभी इंटरनेट से जुड़ेगा, DUET STEM में दर्ज हो जाएगा।</span></p>
<h2>Apps · ऐप</h2><ul>{rows}</ul>
<p class="m">Help · मदद: info@duetpower.in</p>
</div></body></html>
'''


def code_txt(code, school, until):
    return '﻿' + f'''DUET STEM - school code / विद्यालय कोड
========================================

    {code}

School / विद्यालय: {school or '-'}
Valid until / मान्य: {until or '-'}

Windows / Linux / Mac: double-click START-DUET-STEM. The apps open already
activated (on the first computer or panel this pen drive is started on).

Android panel: install the apps from the ANDROID folder, open each app and
type this code once. It works without the internet. The first device it is
typed on keeps it; when that device is ever online it is registered with
DUET STEM, and other devices with the same code are refused.

Windows / Linux / Mac: START-DUET-STEM पर दो बार क्लिक कीजिए। ऐप पहले से चालू
खुलेंगे (उसी कंप्यूटर या पैनल पर जिस पर यह पेन ड्राइव पहली बार चलाई जाए)।

Android पैनल: ANDROID फ़ोल्डर से ऐप इंस्टॉल कीजिए, हर ऐप खोलकर यह कोड एक बार
लिखिए। यह बिना इंटरनेट के चलता है।

Help / मदद: info@duetpower.in
'''


def unix_script(kind):
    if kind == 'mac':
        arch = 'case "$(uname -m)" in arm64) B=mac-arm64 ;; *) B=mac-x64 ;; esac'
        head = '# DUET STEM on a Mac: double-click this file (if the Mac refuses: right-click it, Open, Open).'
    else:
        arch = 'case "$(uname -m)" in x86_64|amd64) B=linux-x64 ;; aarch64|arm64) B=linux-arm64 ;; *) echo "This computer ($(uname -m)) is not supported. / यह कंप्यूटर समर्थित नहीं है।"; exit 1 ;; esac'
        head = '# DUET STEM on Linux: right-click this file, "Run as a Program" (or in a Terminal: sh START-DUET-STEM-Linux.sh).'
    return f'''#!/bin/sh
{head}
# It starts the pen drive's launcher for this computer; keep its window open while you teach.
D="$(cd "$(dirname "$0")" && pwd)"
{arch}
BIN="$D/DUET-STEM/launcher/start-duet-stem-$B"
if [ ! -f "$BIN" ]; then echo "Missing: $BIN (copy the whole pen drive again)"; exit 1; fi
if [ -x "$BIN" ]; then exec "$BIN" -root "$D/DUET-STEM" "$@"; fi
# a FAT drive mounted without "run" permission: run a copy from a temporary folder (deleted afterwards)
T="$(mktemp -d)" || exit 1
trap 'rm -rf "$T"' EXIT INT TERM HUP
cp "$BIN" "$T/start-duet-stem" && chmod +x "$T/start-duet-stem" && "$T/start-duet-stem" -root "$D/DUET-STEM" "$@"
'''
