// DUET STEM school codes: each code works on as many devices as it was sold for ("n" in licences.json; 0 = any).
// A Google Apps Script web app over a Google Sheet. When a code is typed (and again whenever the app is online), the
// app asks here for a place for this device: the same device always gets its place back; a new device gets one while
// places are left, otherwise the code is refused on it. Every app counts on its own (a phone with Science Lab and
// Human Body uses one place in each), so a device id only has to stay the same inside one app.
//
// The sheet "Activations": one row per device that took a place (and per refused try). To move a code to another
// device, type freed in the Status column of the old device's row. Columns:
//   When | Code (last 4) | School | App | Device | Device id | Status | Code hash (start) | Last seen
// Setup: see README.md beside this file.
const LIST = 'https://ashutoshduet.github.io/duet-lms-media/licences.json';
const SHEET = 'Activations';
const HEAD = ['When', 'Code (last 4)', 'School', 'App', 'Device', 'Device id', 'Status', 'Code hash (start)', 'Last seen'];

function doGet(e) { return json(claim((e && e.parameter) || {})); }
function doPost(e) { let p = {}; try { p = JSON.parse(e.postData.contents); } catch (err) {} return json(claim(p)); }
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function codes() {
  const c = CacheService.getScriptCache(); const hit = c.get('codes');
  if (hit) return JSON.parse(hit);
  const j = JSON.parse(UrlFetchApp.fetch(LIST + '?t=' + Date.now(), { muteHttpExceptions: true }).getContentText());
  const out = {}; for (const [h, e] of Object.entries(j.codes || {})) out[h] = { n: +e.n || 0, r: e.r ? 1 : 0, a: e.a || [], u: e.u || '' };
  try { c.put('codes', JSON.stringify(out), 300); } catch (err) {}
  return out;
}
function sheet() {
  const ss = SpreadsheetApp.getActive(); let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEAD); sh.setFrozenRows(1); sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold'); }
  return sh;
}
const clip = (s, n) => String(s == null ? '' : s).replace(/[\r\n\t]/g, ' ').slice(0, n);

function claim(p) {
  const h = clip(p.h, 64).toLowerCase(), app = clip(p.a, 12), dev = clip(p.d, 64);
  if (!/^[0-9a-f]{64}$/.test(h) || !/^[a-z]+$/.test(app) || !/^[0-9a-z]{8,64}$/.test(dev)) return { ok: false, err: 'bad' };
  const all = codes(); let e = all[h];
  if (!e) { CacheService.getScriptCache().remove('codes'); e = codes()[h]; } // a code issued in the last few minutes
  if (!e || e.r) return { ok: false, err: 'bad' };
  if (!(e.a.indexOf('*') >= 0 || e.a.indexOf(app) >= 0)) return { ok: false, err: 'app' };
  const max = e.n, key = 'h' + h.slice(0, 16), now = new Date(); // letters first, so the sheet keeps it as text
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sheet(), rows = sh.getDataRange().getValues(); const taken = new Set(); let mine = -1;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]; if (r[7] !== key || r[3] !== app) continue;
      const st = String(r[6]).trim().toLowerCase(); if (st !== 'active') continue;
      taken.add(r[5]); if (r[5] === dev) mine = i;
    }
    if (mine > 0) { sh.getRange(mine + 1, 9).setValue(now); return { ok: true, n: taken.size, max }; }
    const row = [now, clip(p.k, 4), clip(p.s, 80), app, clip(p.m, 60), dev, '', key, now];
    if (max && taken.size >= max) { row[6] = 'refused'; sh.appendRow(row); return { ok: false, err: 'used', n: taken.size, max }; }
    row[6] = 'active'; sh.appendRow(row); return { ok: true, n: taken.size + 1, max };
  } finally { lock.releaseLock(); }
}
