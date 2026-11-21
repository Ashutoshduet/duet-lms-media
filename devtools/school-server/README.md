# DUET STEM classes (live results)

`Code.gs` is the live side of the Robotics Lab's school layer (`robotics/js/school.js`): a Google Apps Script web app over
a Google Sheet ("DUET STEM classes (live results)") in DUET STEM's Google account. Teachers' classes and assignments,
students' finished lessons (stars, score, time, mistakes, hints), the parents' portfolio and the principal's school view.
No server to run; the apps also work without it (QR codes), so a school with no internet loses nothing.

## Setup (once, done 21 Nov 2026)
1. A Google Sheet → Extensions → Apps Script → paste `Code.gs` → save (project "DUET STEM classes").
2. Deploy → New deployment → Web app: Execute as **Me**, Who has access **Anyone** → Deploy → Authorize access (the
   owner approves: Sheets, and fetching the public licences.json).
3. Put the web app URL in `licences.json` as `"sync"` (beside `"claim"`), commit and publish. The apps read it from there.

To change the code later: paste the new `Code.gs`, then Deploy → Manage deployments → ✎ → Version: New → Deploy (the URL
stays the same).

## Keys (no passwords)
- class code (6 letters): students join; a teacher key (20 letters, only its SHA-256 here) reads the class and edits it.
- portfolio key (14 letters, per student): one student's work, read only (`robotics/portfolio.html?p=…`).
- the school's DUET STEM code (typed by the principal): every class made on a device activated with that code; the code
  is only hashed and checked against `licences.json`, never stored.

## Sheets
`Classes`, `Students`, `Results` (every cell is text: a code like 12E345 must not turn into a number). Results are
appended; the best of each student and lesson is worked out when read.

Tests: `devtools/test/roboschool.mjs` plays the same actions with an in-memory copy of this script in the browser test.
