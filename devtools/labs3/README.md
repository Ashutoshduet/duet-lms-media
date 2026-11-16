# Organ Labs: arm, leg, urinary system, pancreas & spleen; journeys reflex and hormones

Scripts as run on the build machine (paths inside them: /root/work, /root/src). Same tools as `../labs2`.

1. `build_arm.py`, `build_leg.py`: Z-Anatomy (CC BY-SA 4.0, /root/work/za3 export) right arm / right leg; each muscle that
   crosses the joint is its own mesh (`biceps_1`…), and the json gets the hinge axis and each muscle's origin and insertion
   (the app stretches the muscle between them in the vertex shader) and the reflex paths.
2. `hra_peek.py '<regex>' <out.pkl>` then `build_hra3.py urinary pancreas`: NIH HRA united male (CC BY 4.0).
3. `node /root/gt/labcompress.mjs arm leg urinary pancreas` (meshopt) → `body/models/labs/<lab>.glb`.
4. `content3.py`: parts, lab steps and journey steps in en / hi / hg into `body/models/content.json`.
5. `narrate3.py 0 2` and `narrate3.py 1 2` (Piper, two workers), then `narrate3.py index` (audio list, Hinglish = Hindi recording).
