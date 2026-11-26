# A DUET web app on duetpower.in, updating itself

`sync.php` keeps a folder on the DV Hosting site a copy of one app as published on GitHub Pages. Live:
**duetpower.in/robotics/lab/** = Robotics Lab 360 (set up 21 Nov 2026; the Build Lab at duetpower.in/robotics/ is a
different app and is untouched).

- Opened in a browser it copies what is new or changed (checked against `offline.json` hashes) and shows the progress.
- The app itself asks `sync.php?check=1` a few seconds after it opens (robotics/index.html, only on duetpower.in), at most
  every 10 minutes, so a new version arrives on its own; a cron job (`php …/sync.php`) would do the same.
- `licences.json` and `support.html` go one folder up (`/robotics/`), where the app looks for them.
- It writes only the files the list names: never `.php`, `.htaccess`, dot-files or paths with `..`.

# LMS media on duetpower.in

- `media-sync.php` → `public_html/lms/media/library/media-sync.php`. Opened in a browser it copies every file in
  `media-manifest.json` (branch `media-archive`) that is missing or of the wrong size, checks each one by SHA-1, and then
  checks them all. `?mode=status`, `?mode=run&n=5`, `?mode=verify&from=0&n=40`. Never deletes; never writes `.php`,
  `.htaccess`, dot-files or paths with `..`.
- `build_manifest.py <duet-lms-media clone> <duet-lms-media-2 clone>` writes `media-manifest.json`; commit it to the
  `media-archive` branch (new or changed files are then copied on the next run of `media-sync.php`).
- `relink.php` → `public_html/relink.php` (the copy there has its own key in place of `__KEY__`). `?mode=check` counts the
  GitHub and duetpower.in links in `lms/content/*.json` and in the lesson overrides saved in the LMS database (table
  `kv`: videos, media links, photos; read through the LMS's own `lms/api/lib/bootstrap.php`); `apply` (key needed, or
  `php relink.php apply` from a cron job) switches each link whose file is already on duetpower.in and keeps the
  originals (`<name>.json.github-links`, database rows in `lms/content/kv.json.github-links`); `undo` puts them back.
- `library.htaccess` → `public_html/lms/media/library/.htaccess` and `cors.php` → `public_html/lms/media/library/cors.php`:
  right file types (`.webp`, `.glb`, `.md`), and a page on another site (e.g. www.duetpower.in) gets
  `Access-Control-Allow-Origin: *` like on GitHub Pages (this server has no mod_headers, so such requests go through
  `cors.php`; requests from duetpower.in itself are served directly).
