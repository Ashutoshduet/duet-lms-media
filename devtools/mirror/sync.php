<?php
// DUET STEM: keeps this folder a copy of one DUET STEM web app as published on the website (GitHub Pages), so the app
// runs from duetpower.in (e.g. duetpower.in/robotics/lab/ = Robotics Lab 360) and every update reaches it by itself.
//
//   sync.php            the progress page: copies everything that is new or changed, in steps of ~20 s, until done
//   sync.php?check=1    quick (the app asks on load, at most every 10 minutes): one step only when the website is newer
//   php sync.php        from a cron job: the whole copy at once
//
// The app's list of files and their hashes is <app>/offline.json on the website. Changed files are fetched and checked
// against their hash; offline.json and sw.js are written last, so the app's offline copy (its service worker) sees a
// new version only when every file of it is here. licences.json and support.html (the school codes, the help page)
// go one folder up, where the app looks for them ("../licences.json").
// Only the files the list names are written, never a .php, .phtml, .htaccess or a name with "..".
// Setup: put this one file in an empty folder under public_html and open it once in the browser.
const ORIGIN = 'https://ashutoshduet.github.io/duet-lms-media/';
const APP = 'robotics';
const STEP_SECONDS = 20;
const CHECK_EVERY = 600;

@set_time_limit(120);
ignore_user_abort(true);
$dir = __DIR__;
$up = dirname($dir);
$state_f = $dir . '/.sync-state.json';
$cli = PHP_SAPI === 'cli';
$check = !$cli && isset($_GET['check']);

function http_get($url, $timeout = 30) {
  if (function_exists('curl_init')) {
    $c = curl_init($url);
    curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => $timeout,
      CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_USERAGENT => 'DUET-STEM-sync/1', CURLOPT_ENCODING => '']);
    $b = curl_exec($c); $code = curl_getinfo($c, CURLINFO_HTTP_CODE); curl_close($c);
    return ($b !== false && $code === 200) ? $b : null;
  }
  $ctx = stream_context_create(['http' => ['timeout' => $timeout, 'user_agent' => 'DUET-STEM-sync/1']]);
  $b = @file_get_contents($url, false, $ctx);
  return $b === false ? null : $b;
}
// several files at once (curl_multi): [rel => body or null]
function http_many($urls, $timeout = 60) {
  $out = [];
  if (!function_exists('curl_multi_init')) { foreach ($urls as $k => $u) $out[$k] = http_get($u, $timeout); return $out; }
  $m = curl_multi_init(); $hs = [];
  foreach ($urls as $k => $u) {
    $c = curl_init($u);
    curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => $timeout,
      CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_USERAGENT => 'DUET-STEM-sync/1', CURLOPT_ENCODING => '']);
    curl_multi_add_handle($m, $c); $hs[$k] = $c;
  }
  do { $st = curl_multi_exec($m, $run); if ($run) curl_multi_select($m, 1.0); } while ($run && $st === CURLM_OK);
  foreach ($hs as $k => $c) {
    $b = curl_multi_getcontent($c); $code = curl_getinfo($c, CURLINFO_HTTP_CODE);
    $out[$k] = ($code === 200 && $b !== null && $b !== false) ? $b : null;
    curl_multi_remove_handle($m, $c); curl_close($c);
  }
  curl_multi_close($m);
  return $out;
}
function safe_rel($rel) {
  if (!is_string($rel) || $rel === '' || strlen($rel) > 200) return false;
  if (!preg_match('~^[A-Za-z0-9._/-]+$~', $rel)) return false;
  if (strpos($rel, '..') !== false || $rel[0] === '/' || $rel[0] === '.') return false;
  if (preg_match('~(^|/)\.|\.(php\d?|phtml|phar|htaccess|htpasswd|cgi|pl|sh)$~i', $rel)) return false;
  return true;
}
function put_file($path, $body) {
  $d = dirname($path); if (!is_dir($d) && !@mkdir($d, 0755, true)) return false;
  $tmp = $path . '.part-' . getmypid();
  if (@file_put_contents($tmp, $body) === false) return false;
  return @rename($tmp, $path);
}
function load_state($f) { $s = @json_decode(@file_get_contents($f), true); return is_array($s) ? $s : ['v' => '', 't' => 0, 'have' => [], 'checked' => 0]; }
function save_state($f, $s) { @file_put_contents($f, json_encode($s)); }

// one step: up to $budget seconds of copying. -> [done, todo, total, message]
function step($budget) {
  global $dir, $up, $state_f;
  $lock = fopen($dir . '/.sync-lock', 'c');
  if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) return [false, -1, -1, 'busy'];
  $s = load_state($state_f);
  $raw = http_get(ORIGIN . APP . '/offline.json?t=' . time());
  $man = $raw ? json_decode($raw, true) : null;
  if (!$man || !isset($man['files']) || !is_array($man['files'])) { flock($lock, LOCK_UN); return [false, -1, -1, 'The website could not be reached.']; }
  $s['checked'] = time();
  $todo = [];
  foreach ($man['files'] as $rel => $e) {
    if (!safe_rel($rel) || !is_array($e)) continue;
    if (($s['have'][$rel] ?? '') !== $e[0] || !is_file($dir . '/' . $rel)) $todo[$rel] = $e;
  }
  $total = count($man['files']); $t0 = microtime(true); $failed = 0;
  $keys = array_keys($todo);
  for ($i = 0; $i < count($keys) && microtime(true) - $t0 < $budget; $i += 8) {
    $batch = array_slice($keys, $i, 8); $urls = [];
    foreach ($batch as $rel) $urls[$rel] = ORIGIN . APP . '/' . str_replace('%2F', '/', rawurlencode($rel)) . '?v=' . $todo[$rel][0];
    foreach (http_many($urls) as $rel => $body) {
      if ($body === null || substr(sha1($body), 0, 12) !== $todo[$rel][0]) { $failed++; continue; }
      if (put_file($dir . '/' . $rel, $body)) { $s['have'][$rel] = $todo[$rel][0]; unset($todo[$rel]); } else $failed++;
    }
    save_state($state_f, $s);
  }
  $left = count($todo);
  if ($left === 0) {
    // the last files: the worker and the list (the app's offline copy moves on only now), and the files one folder up
    $sw = http_get(ORIGIN . APP . '/sw.js?v=' . rawurlencode($man['v'] ?? ''));
    if ($sw !== null) put_file($dir . '/sw.js', $sw);
    put_file($dir . '/offline.json', $raw);
    foreach (['licences.json', 'support.html'] as $f) { $b = http_get(ORIGIN . $f . '?t=' . time()); if ($b !== null && ($f !== 'licences.json' || json_decode($b) !== null)) put_file($up . '/' . $f, $b); }
    $s['v'] = $man['v'] ?? ''; $s['t'] = $man['t'] ?? 0;
  }
  save_state($state_f, $s);
  flock($lock, LOCK_UN);
  return [$left === 0, $left, $total, $failed ? "$failed files could not be fetched this time (they are tried again)." : ''];
}

if ($cli) { do { [$ok, $left] = step(300); echo $ok ? "up to date\n" : "left: $left\n"; } while (!$ok && $left > 0); exit; }

if ($check) { // the app's quick look (at most every 10 minutes); copies for one step when the website is newer
  header('Content-Type: application/json'); header('Cache-Control: no-store');
  $s = load_state($state_f);
  if (time() - ($s['checked'] ?? 0) < CHECK_EVERY) { echo json_encode(['ok' => true, 'v' => $s['v'], 'skip' => 1]); exit; }
  $s['checked'] = time(); save_state($state_f, $s);
  if (function_exists('fastcgi_finish_request')) { echo json_encode(['ok' => true, 'v' => $s['v']]); fastcgi_finish_request(); step(STEP_SECONDS); exit; }
  [$ok, $left] = step(STEP_SECONDS); echo json_encode(['ok' => $ok, 'left' => $left]); exit;
}

[$ok, $left, $total, $msg] = step(STEP_SECONDS);
$s = load_state($state_f);
$done = $total > 0 ? $total - max(0, $left) : 0; $pct = $total > 0 ? floor($done * 100 / $total) : 0;
header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-store');
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DUET STEM · update</title><?php if (!$ok && $left !== -1) echo '<meta http-equiv="refresh" content="1">'; ?>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0e13;color:#f2ede4;font:16px/1.5 system-ui,sans-serif}
.b{width:min(460px,90vw);padding:24px;border-radius:16px;background:#141a24;border:1px solid #2a3140}.bar{height:8px;border-radius:4px;background:#2a3140;overflow:hidden;margin:14px 0}
.bar i{display:block;height:100%;background:#f0a65a}a{color:#7fd1ff}small{color:#a39c90}</style></head><body><div class="b">
<h2 style="margin:0 0 6px">DUET STEM · <?= htmlspecialchars(APP) ?></h2>
<?php if ($ok): ?><p>✓ Up to date (<?= htmlspecialchars($s['v']) ?>). <a href="./">Open the app →</a></p>
<?php elseif ($left === -1): ?><p><?= htmlspecialchars($msg === 'busy' ? 'An update is already running; this page will try again.' : $msg) ?></p><meta http-equiv="refresh" content="5">
<?php else: ?><p>Copying the newest version… <?= $pct ?>% (<?= $done ?> of <?= $total ?> files)</p><div class="bar"><i style="width:<?= $pct ?>%"></i></div><small><?= htmlspecialchars($msg) ?> Keep this page open.</small>
<?php endif; ?></div></body></html>
