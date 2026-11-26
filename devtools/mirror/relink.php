<?php
// DUET STEM LMS: points the lesson content at the media copy on duetpower.in instead of GitHub Pages.
// Lives in public_html/ (the site root). It switches the links in public_html/lms/content/*.json and in the lesson
// overrides that admins save in the LMS database (videos, media links, photos: table kv, read through the LMS's own
// lms/api/lib/bootstrap.php). A link is switched only when its file is already in public_html/lms/media/library/
// (copied there by media-sync.php). apply and undo need &key=<the key set below on the server>.
//   ?mode=check   counts the GitHub and duetpower.in links, and whether the media copy is complete
//   ?mode=apply   keeps the originals (<name>.json.github-links; database rows in lms/content/kv.json.github-links),
//                 then switches every link whose file is here
//                 (cron: php relink.php apply  - run hourly, so content published later with GitHub links is switched too)
//   ?mode=undo    puts the originals back
// Nothing is deleted: the originals stay as *.github-links.
$CLI = PHP_SAPI === 'cli';
if (!$CLI) { header('Content-Type: application/json'); header('Cache-Control: no-store'); }
$CONTENT = realpath(__DIR__ . '/lms/content'); $LIB = __DIR__ . '/lms/media/library';
const KEY = '__KEY__'; // set on the server only
const RL_GH1 = 'https://ashutoshduet.github.io/duet-lms-media/', RL_GH2 = 'https://ashutoshduet.github.io/duet-lms-media-2/';
const RL_HOME = 'https://duetpower.in/lms/media/library/';
const RL_KV = ['videos', 'media', 'photos'];
const RL_JSON = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES;

function rl_files($dir) { return array_values(array_filter(glob("$dir/*.json"), fn($f) => preg_match('~/(dg\.)?[a-z]+\.json$~', $f))); }
// a GitHub link becomes a duetpower.in link only when that file is already here (a newer file still on GitHub keeps its link)
function rl_relink($s, $LIB) {
  return preg_replace_callback('#https://ashutoshduet\.github\.io/duet-lms-media(-2)?/([A-Za-z0-9_./%~+-]*)#', function ($m) use ($LIB) {
    $local = ($m[1] ? '2/' : '') . rawurldecode($m[2]);
    if ($m[2] === '' || substr($m[2], -1) === '/') return is_dir("$LIB/$local") ? RL_HOME . ($m[1] ? '2/' : '') . $m[2] : $m[0];
    return (strpos($local, '..') === false && is_file("$LIB/$local")) ? RL_HOME . ($m[1] ? '2/' : '') . $m[2] : $m[0];
  }, $s);
}
function rl_count($s) { return ['github' => substr_count($s, RL_GH1), 'github2' => substr_count($s, RL_GH2), 'duetpower' => substr_count($s, RL_HOME)]; }
function rl_media_complete($LIB) {
  $cache = $LIB . '/.media-manifest-cache.json'; if (!is_file($cache)) return [false, 'no list yet: open media-sync.php first'];
  $m = json_decode(file_get_contents($cache), true); $missing = 0;
  foreach ($m['files'] as $f) { $p = $f['p']; if (strpos($p, '..') !== false || preg_match('~(^|/)\.|\.(php\d?|phtml|htaccess)$~i', $p)) continue;
    $t = $LIB . '/' . $p; if (!is_file($t) || filesize($t) != $f['s']) $missing++; }
  return [$missing === 0, "$missing files not copied yet"];
}
// the LMS database, through the LMS's own functions (kv_all, kv_set), whatever database it uses
function rl_db() {
  static $ok = null; if ($ok !== null) return $ok;
  $ok = false; $b = __DIR__ . '/lms/api/lib/bootstrap.php';
  try { if (is_file($b)) { require_once $b; $ok = function_exists('kv_all') && function_exists('kv_set') && function_exists('config') && config(); } }
  catch (Throwable $e) { $ok = false; }
  restore_exception_handler();
  return $ok;
}
function rl_kv_rows() { $o = []; foreach (RL_KV as $c) foreach (kv_all($c) as $id => $d) $o[] = [$c, (string) $id, $d]; return $o; }
function rl_kv_count() { $s = ''; foreach (rl_kv_rows() as [, , $d]) $s .= json_encode($d, RL_JSON); return rl_count($s); }

if (!$CONTENT) { http_response_code(500); exit(json_encode(['error' => 'content folder not found'])); }
$mode = $CLI ? ($argv[1] ?? 'check') : ($_GET['mode'] ?? 'check'); $out = [];
if (!$CLI && $mode !== 'check' && !hash_equals(KEY, (string)($_GET['key'] ?? ''))) { http_response_code(403); exit(json_encode(['error' => 'key needed'])); }
$KVB = "$CONTENT/kv.json.github-links";
try {
  if ($mode === 'check') {
    [$ok, $why] = rl_media_complete($LIB); $out['mediaComplete'] = $ok; if (!$ok) $out['media'] = $why;
    foreach (rl_files($CONTENT) as $f) $out['files'][basename($f)] = rl_count(file_get_contents($f)) + ['backup' => is_file("$f.github-links")];
    $out['database'] = rl_db() ? rl_kv_count() + ['backup' => is_file($KVB)] : 'not reached';
  } elseif ($mode === 'apply') {
    [$ok, $why] = rl_media_complete($LIB); $out['mediaComplete'] = $ok;
    foreach (rl_files($CONTENT) as $f) {
      $s = file_get_contents($f); $n = rl_relink($s, $LIB);
      if ($n === $s) { $out['files'][basename($f)] = 'nothing to switch'; continue; }
      if (!is_file("$f.github-links")) copy($f, "$f.github-links");
      file_put_contents("$f.tmp", $n); rename("$f.tmp", $f); $out['files'][basename($f)] = rl_count($n);
    }
    if (!rl_db()) $out['database'] = 'not reached';
    else {
      $back = is_file($KVB) ? (json_decode(file_get_contents($KVB), true) ?: []) : []; $todo = [];
      foreach (rl_kv_rows() as [$c, $id, $d]) {
        $s = json_encode($d, RL_JSON); $n = rl_relink($s, $LIB);
        if ($n === $s) continue;
        if (!isset($back[$c][$id])) $back[$c][$id] = $d;          // first original wins: undo always goes back to GitHub links
        $todo[] = [$c, $id, json_decode($n, true)];
      }
      if ($todo) {
        file_put_contents("$KVB.tmp", json_encode($back, RL_JSON)); rename("$KVB.tmp", $KVB);   // backup before any change
        foreach ($todo as [$c, $id, $d]) kv_set($c, $id, $d);
      }
      $out['database'] = ['switched' => count($todo)] + rl_kv_count();
    }
  } elseif ($mode === 'undo') {
    foreach (rl_files($CONTENT) as $f) if (is_file("$f.github-links")) { copy("$f.github-links", "$f.tmp"); rename("$f.tmp", $f); $out['files'][basename($f)] = 'restored'; }
    if (is_file($KVB) && rl_db()) { $n = 0; foreach (json_decode(file_get_contents($KVB), true) ?: [] as $c => $rows) foreach ($rows as $id => $d) { kv_set((string) $c, (string) $id, $d); $n++; } $out['database'] = "restored $n rows"; }
  } else { $out['error'] = 'unknown mode'; }
} catch (Throwable $e) { http_response_code(500); $out['error'] = 'failed: ' . $e->getMessage(); }
echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), $CLI ? "\n" : '';
