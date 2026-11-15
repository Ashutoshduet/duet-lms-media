# Organ Labs from the NIH Human Reference Atlas: mouth, intestines, liver, knee

Source: HRA 3D reference organs (male), CC BY 4.0, https://humanatlas.io (cdn.humanatlas.io/digital-objects/ref-organ/…):
mouth-male, small-intestine-male, large-intestine-male, liver-male, knee-male-left.

1. `build.py gut mouth liver knee`: the organ's pieces grouped into the parts the lab names (labs.build from the
   earlier labs; needs /root/work/labs.py, process_v3.py); liver segments stay separate pieces (`liver_right_lobe_1`…)
   so each gets its own shade; the knee is cut to a 10 cm ball around the joint.
2. copy `build3/labs/<lab>.json` to `body/models/labs/`, then `paths.py gut mouth liver knee`: centres and flow paths
   (the intestines' centre lines are rings of equal distance along the surface from one end; saliva from each gland to
   its duct opening; the food ball over the tongue; the knee's hinge line).
3. `compress.mjs` (gltf-transform + meshoptimizer): `body/models/labs/<lab>.glb`.
4. `content_new.py`: names, jobs and processes of the new parts and the tour steps (English, Hindi, Hinglish) into
   `body/models/content.json`; `narrate.py`: Piper narration of the steps (Hinglish plays the Hindi recording).
The tours, colours, cut, take-apart, flows and the bending knee are in `body/js/lab.js` (LABS, PAL, STEPS, CUT,
EXPLODE, defineFlows, buildExtras, update).
