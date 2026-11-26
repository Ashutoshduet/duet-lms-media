<?php
// DUET STEM LMS media on duetpower.in (public_html/lms/media/library/cors.php).
// GitHub Pages sent "Access-Control-Allow-Origin: *" with every file, so a page on another site (for example
// www.duetpower.in) could load the 3D models and pictures. This server has no mod_headers, so .htaccess sends only the
// requests that carry a foreign Origin header here, and this sends the same file with that header.
// Only files of this folder; never .php, .htaccess, dot-files or paths with "..".
$base = realpath(__DIR__);
$f = (string)($_GET['f'] ?? '');
$p = $f === '' ? false : realpath($base . '/' . $f);
if ($p === false || strpos($f, '..') !== false || strpos($p, $base . '/') !== 0 || !is_file($p)
    || preg_match('~(^|/)\.|\.(php\d?|phtml|htaccess)$~i', $f)) { http_response_code(404); exit; }
$types = ['webp' => 'image/webp', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'svg' => 'image/svg+xml',
  'glb' => 'model/gltf-binary', 'js' => 'text/javascript', 'md' => 'text/markdown', 'json' => 'application/json'];
header('Access-Control-Allow-Origin: *');
header('Content-Type: ' . ($types[strtolower(pathinfo($p, PATHINFO_EXTENSION))] ?? 'application/octet-stream'));
header('Cache-Control: public, max-age=600');
header('Content-Length: ' . filesize($p));
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') exit;
readfile($p);
