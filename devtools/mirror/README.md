# A DUET web app on duetpower.in, updating itself

`sync.php` keeps a folder on the DV Hosting site a copy of one app as published on GitHub Pages. Live:
**duetpower.in/robotics/lab/** = Robotics Lab 360 (set up 21 Nov 2026; the Build Lab at duetpower.in/robotics/ is a
different app and is untouched).

- Opened in a browser it copies what is new or changed (checked against `offline.json` hashes) and shows the progress.
- The app itself asks `sync.php?check=1` a few seconds after it opens (robotics/index.html, only on duetpower.in), at most
  every 10 minutes, so a new version arrives on its own; a cron job (`php …/sync.php`) would do the same.
- `licences.json` and `support.html` go one folder up (`/robotics/`), where the app looks for them.
- It writes only the files the list names: never `.php`, `.htaccess`, dot-files or paths with `..`.
