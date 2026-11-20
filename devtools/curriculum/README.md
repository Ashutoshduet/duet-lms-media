# DUET Robotics & AI curriculum data

- `ideabank.py` writes `ideas.json`: every project plan (live lessons + planned ideas), with board, parts, new parts needed, class band and the input -> output rule the project factory uses.
- `curriculum.py` writes `curriculum.json`: Class 1-12, 32 sessions each (terms, challenges at 8/16/24, capstone 30-32), each session linked to a live lesson or a planned idea.
- `render_md.py s4|s5|s6|s7|s8` prints the session tables as Markdown (the curriculum doc and the pen-drive pack use them).
- `live.mjs` lists the lessons that are in `robotics/js/lessons*.js`.

Ideas come from the common stock of school electronics worldwide (Arduino examples, micro:bit classroom projects, SparkFun-style circuits, Raspberry Pi physical computing, maker sites, ATL practice). Every project is written by DUET; nothing is copied.
