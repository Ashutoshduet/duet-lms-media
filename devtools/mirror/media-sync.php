<?php
// DUET STEM LMS media on duetpower.in: keeps this folder (public_html/lms/media/) a copy of every LMS video,
// picture and 3D model listed in media-manifest.json (branch media-archive of Ashutoshduet/duet-lms-media).
// Open it in a browser: it copies what is missing or changed, a few files at a time, and shows the progress.
//   ?mode=status          counts (by size): total, ok, left
//   ?mode=run&n=3         copies the next n files that are missing or of the wrong size (each checked by SHA-1)
//   ?mode=verify&from=0&n=40   checks the SHA-1 of n files from position "from" and lists any that differ
// It writes only the files the list names, inside this folder: never .php, .htaccess, dot-files or paths with "..".
// Nothing is ever deleted.
set_time_limit(300); ignore_user_abort(true);
const MANIFEST = 'https://raw.githubusercontent.com/Ashutoshduet/duet-lms-media/media-archive/media-manifest.json';
$DIR = __DIR__;

function fetch_to($url, $file) {
  $fh = fopen($file, 'wb'); if (!$fh) return false;
  $c = curl_init($url);
  curl_setopt_array($c, [CURLOPT_FILE => $fh, CURLOPT_FOLLOWLOCATION => true, CURLOPT_CONNECTTIMEOUT => 20,
    CURLOPT_TIMEOUT => 240, CURLOPT_USERAGENT => 'duet-media-sync/1', CURLOPT_FAILONERROR => true]);
  $ok = curl_exec($c) && curl_getinfo($c, CURLINFO_HTTP_CODE) == 200; curl_close($c); fclose($fh);
  return $ok;
}
function manifest() {
  $cache = __DIR__ . '/.media-manifest-cache.json';
  if (is_file($cache) && time() - filemtime($cache) < 600) { $m = json_decode(file_get_contents($cache), true); if ($m) return $m; }
  $tmp = $cache . '.part';
  if (fetch_to(MANIFEST . '?t=' . time(), $tmp)) { $m = json_decode(file_get_contents($tmp), true); if ($m && isset($m['files'])) { rename($tmp, $cache); return $m; } }
  @unlink($tmp);
  if (is_file($cache)) return json_decode(file_get_contents($cache), true);
  return null;
}
function safe($p) { return $p !== '' && strpos($p, '..') === false && !preg_match('~(^|/)\.|\.(php\d?|phtml|htaccess)$~i', $p); }
function out($a) { header('Content-Type: application/json'); header('Cache-Control: no-store'); echo json_encode($a); exit; }

$mode = $_GET['mode'] ?? '';
if ($mode !== '') {
  $m = manifest(); if (!$m) { http_response_code(502); out(['error' => 'list not reachable']); }
  $files = array_values(array_filter($m['files'], fn($f) => safe($f['p'])));
  $left = array_values(array_filter($files, fn($f) => !(is_file("$DIR/{$f['p']}") && filesize("$DIR/{$f['p']}") == $f['s'])));
  if ($mode === 'status') out(['total' => count($files), 'ok' => count($files) - count($left), 'left' => count($left),
    'bytes' => array_sum(array_column($files, 's')), 'bytesLeft' => array_sum(array_column($left, 's'))]);
  if ($mode === 'run') {
    $n = max(1, min(10, intval($_GET['n'] ?? 3))); $res = [];
    foreach (array_slice($left, 0, $n) as $f) {
      $t = "$DIR/{$f['p']}"; if (!is_dir(dirname($t))) mkdir(dirname($t), 0755, true);
      $part = "$t.part"; $ok = fetch_to($f['u'], $part) && filesize($part) == $f['s'] && sha1_file($part) === $f['h'];
      if ($ok) rename($part, $t); else @unlink($part);
      $res[] = ['p' => $f['p'], 'ok' => $ok];
    }
    out(['done' => $res, 'left' => count($left) - count(array_filter($res, fn($r) => $r['ok']))]);
  }
  if ($mode === 'verify') {
    $from = max(0, intval($_GET['from'] ?? 0)); $n = max(1, min(200, intval($_GET['n'] ?? 40))); $bad = [];
    foreach (array_slice($files, $from, $n) as $f) { $t = "$DIR/{$f['p']}"; if (!is_file($t) || filesize($t) != $f['s'] || sha1_file($t) !== $f['h']) $bad[] = $f['p']; }
    out(['from' => $from, 'checked' => count(array_slice($files, $from, $n)), 'total' => count($files), 'bad' => $bad]);
  }
  out(['error' => 'unknown mode']);
}
?><!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DUET LMS media copy</title>
<style>body{font:16px system-ui,sans-serif;margin:24px;max-width:760px}#bar{height:14px;background:#eee;border-radius:7px;overflow:hidden}#bar i{display:block;height:100%;width:0;background:#f0a65a}pre{white-space:pre-wrap;font-size:13px;color:#555}</style>
<h2>DUET STEM LMS media → duetpower.in/lms/media</h2>
<div id="bar"><i></i></div><p id="st">Checking…</p><pre id="log"></pre>
<script>
const st = document.getElementById('st'), log = document.getElementById('log'), bar = document.querySelector('#bar i');
const get = (q) => fetch('?' + q + '&t=' + Date.now(), { cache: 'no-store' }).then((r) => r.json());
(async () => {
  let s = await get('mode=status'), fails = 0;
  while (s.left > 0 && fails < 8) {
    st.textContent = `Copying: ${s.ok} of ${s.total} files here, ${s.left} left (${(s.bytesLeft / 1048576).toFixed(0)} MB)`;
    bar.style.width = (100 * s.ok / s.total) + '%';
    try { const r = await get('mode=run&n=3'); for (const d of r.done) log.textContent = (d.ok ? '✓ ' : '✗ ') + d.p + '\n' + log.textContent.slice(0, 4000); if (!r.done.some((d) => d.ok)) fails++; else fails = 0; }
    catch (e) { fails++; await new Promise((k) => setTimeout(k, 3000)); }
    s = await get('mode=status');
  }
  bar.style.width = (100 * s.ok / s.total) + '%';
  if (s.left > 0) { st.textContent = `Stopped: ${s.left} files could not be copied yet. Reload this page to try again.`; return; }
  st.textContent = `All ${s.total} files are here. Checking every file (SHA-1)…`;
  let bad = [];
  for (let i = 0; i < s.total; i += 40) { const v = await get('mode=verify&from=' + i + '&n=40'); bad = bad.concat(v.bad); st.textContent = `Checked ${Math.min(i + 40, s.total)} of ${s.total}…`; }
  st.textContent = bad.length ? `${bad.length} files differ: reload to copy them again.` : `Done: all ${s.total} files copied and checked.`;
  if (bad.length) log.textContent = bad.join('\n');
})();
</script>
