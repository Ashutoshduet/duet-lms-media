# Classroom: teacher's page, quizzes and results

One teacher, a class of students in headsets (or on screens), all three apps: Science Lab 360, Maths Lab 360 and
Human Body 360.

## How a class runs
1. The teacher opens `class/` (https://ashutoshduet.github.io/duet-lms-media/class/) on a laptop or the board's
   computer, names the class and gets a 4-digit class code.
2. Each student opens an app → **👥 Class** (top bar on a screen; in the headset: the button at the top right of the
   step panel in Science/Maths, beside "Walk around" on the menu in Human Body) → types the code and the roll number.
3. The teacher's page shows every student live: a small picture of what they see (every 5 s; "Watch" gives a bigger one
   every 1.5 s), the activity and step, VR or screen, battery, a raised hand (with a beep), quiz progress.
4. The teacher can: **Eyes on me** (every screen goes dark with "Eyes on your teacher" and an optional line),
   **Send to activity** (everyone or one student; any activity, guided journey, organ lab or organ split),
   **Start quiz** (on what each student is doing, on a chosen activity or on a whole chapter), **Message**,
   **Language** (switches every app), **Live screens** on/off, **Lock joining**, **End class**.
5. Results: every quiz and every finished activity is kept on the student's device and sent to the teacher's page,
   again and again until the page confirms it (so a Wi-Fi drop loses nothing). The Results tab shows a student ×
   quiz/activity table with class averages, the questions most often missed, each student's answers, CSV export and a
   printable report. The Attendance tab shows who joined, when, for how long, on which app and device; the teacher can
   type names for roll numbers there.
6. A student's app joins the class again by itself when it is reopened within 3 hours.

## How it works
- WebRTC data channels through PeerJS (MIT, `science/lib/peerjs.min.js`, loaded only when a class is joined). The free
  public PeerJS server (0.peerjs.com) only introduces the teacher's page and the apps; the data goes directly between
  them, so in a school it stays on the school's Wi-Fi. The class's peer id is `duetstem-class-v1-<code>`.
- Code: `science/js/classroom.js` (the link, quiz runner, the picture of the view), `science/js/classui.js` (join,
  raised hand, freeze screen, messages, quiz and results pages on the screen and on the headset panel). These two and
  `lib/peerjs.min.js` are copied to `body/` by the pre-commit hook; edit the science copies only.
- Quizzes: `science/js/quizgen.js` builds them from each activity's own viva questions (wrong choices from the answers
  to the most similar questions of other activities, or the right answer with a nearby wrong number), its "what do you
  see" steps and its conclusion; a chapter quiz mixes all activities of a chapter. `body/js/quizgen.js`: "what is the
  glowing part called?" (the part glows on the body, the view turns to it) and "what does the … do?", by body system,
  organ (split) or organ lab. English, Hindi and Hinglish.
- `class/catalog.json` (written by `devtools/class/catalog.mjs` in the pre-commit hook) lists what the teacher's page
  can send students to.
- The teacher's page keeps everything in its browser (localStorage `duet.teacher.v1`): classes, names, attendance,
  results. Nothing goes to any server of ours.

## The tutor (🤖 Ask)
- Students type a question, speak it (where the browser can listen) or tap one of the suggested questions for what
  they are doing; the answer can be read aloud. In the headset: the suggested questions on the panel.
- Offline (always): `tutor.js` (shared; BM25 search in English, Hindi and Hinglish; a question in Hindi script is
  answered in Hindi, whatever the app's language) over `tutordocs.js` (Science/Maths: every viva question and answer,
  what is seen at each step and why, conclusions, safety; Human Body: every part's job and working, every journey and
  organ-lab step). The activity open now counts higher. "Open it" jumps to the activity an answer came from.
- Online (when switched on): `devtools/tutor/worker.js` is a Cloudflare Worker that answers with Claude, grounded in the
  passages the offline search found. To switch it on: deploy the Worker with the secret `ANTHROPIC_API_KEY`, then add
  `tutor.json` at the site root: `{ "url": "https://<worker>.workers.dev" }`. Without it, everything stays offline.
- In a class, every question goes to the teacher's page too (Results tab: "Questions students asked the tutor";
  the ones the app could not answer are marked, to answer in class).

## Test
`python3 -m http.server 8790` at the repo root, then `cd devtools && node test/classtest.mjs /tmp/ct science maths body`
(a teacher's page and three students over the real public PeerJS server; screenshots in the out folder).

## Not yet
- If a school network blocks WebRTC between devices (client isolation), a relay fallback (TURN or a message broker).
