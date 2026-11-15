# The DUET STEM code register (one device per code)

A school code works on the number of devices it was sold for: `n` in `licences.json` (written by `duetlic.mjs issue
--n 1`; `n: 0` = any number of devices). When a code is typed, the app asks the register for a place for this
device; the same device always gets its place back (reinstalling the app is fine), a new device gets one while places
are left, otherwise the app says the code is already in use. Each app counts on its own. Online, every app asks again
at start, so a code given away later stops on the extra devices.

The register is a Google Apps Script web app over a Google Sheet in DUET STEM's Google account (`Code.gs`). Its URL
is in `licences.json` as `"claim"`, so it can be changed without a new app version. Without `"claim"` the apps
skip the register (codes work on any number of devices, as before).

## Setup (once)
1. A new Google Sheet "DUET STEM code register" → Extensions → Apps Script → paste `Code.gs` → Save.
2. Deploy → New deployment → Web app: Execute as **Me**, Who has access **Anyone** → Deploy → allow the access it asks
   for (it reads the public `licences.json` and writes to this sheet only) → copy the web app URL.
3. Put the URL in `licences.json` as `"claim": "https://script.google.com/macros/s/…/exec"` (devtools/licence-server
   `setclaim` in `duetlic.mjs`), commit and push.

## Day to day
- The "Activations" sheet shows every device that took a place: when, the code's last 4 letters, school, app,
  device model, status, last seen. Refused tries are listed too ("refused").
- To move a code to a new device (a phone was lost or replaced): type `freed` in the Status of the old row.
- To withdraw a code: `node duetlic.mjs revoke CODE` (the apps drop it the next time they are online).
