// Colours for the Human Body models in DUET AR. Those GLBs carry shapes and part names but no colours (the Human Body
// app paints them in its own code), so here is our own palette, part by part, in the usual textbook colours: arteries
// red, veins blue (the lung's vessels the other way round), muscle deep red, bone ivory, nerves yellow, and see-through
// skin, cornea and lens. Used for catalog items with "tint": "anatomy".
import * as THREE from 'three';

// [name test, colour, roughness, opacity] — the first rule that matches wins
const RULES = [
  [/^pulm(onary)?_arter|^pulmonary_trunk/, '#3f62b0', 0.45, 1],
  [/^pulm(onary)?_vein/, '#c4322c', 0.45, 1],
  [/arter|aorta|carotid|subclavian|retinal_vessels/, '#b8291f', 0.42, 1],
  [/vein|vena|sinus$|coronary_sinus/, '#3d5ba8', 0.45, 1],
  [/valve/, '#ead9bb', 0.6, 1],
  [/ventricle|atrium|heart_|septum|papillary/, '#84302a', 0.5, 1],
  [/^skin$/, '#d9a68b', 0.7, 0.2],
  [/skull|vertebra|femur|tibia|fibula|patella|humerus|radius|ulna|rib|sternum|clavicle|scapula|hip|sacrum|^hand$|^foot$|mandible|hyoid|temporal_bone|condyle|incus|malleus|stapes/, '#e7dcc2', 0.62, 1],
  [/^temporal_bone$/, '#e7dcc2', 0.62, 0.35],
  [/teeth|tooth/, '#f5f1e4', 0.28, 1],
  [/nerve|spinal_cord|visual_pathway|optic_disc|nerves/, '#eccd62', 0.5, 1],
  [/cartilage|meniscus|trachea|bronch|cricoid|thyroid_cartilage/, '#e6dcc6', 0.5, 1],
  [/ligament/, '#f1ece0', 0.55, 1],
  [/diaphragm/, '#963a33', 0.6, 1],
  [/lobe|lung/, '#e2a29a', 0.62, 1],
  [/cerebrum|cortex$|sensory_cortex|motor_cortex|insula/, '#dcaaa0', 0.6, 1],
  [/cerebellum/, '#c98c86', 0.6, 1],
  [/corpus_callosum|fornix/, '#efe2d0', 0.55, 1],
  [/^ventricles$|choroid_plexus/, '#6fa6d6', 0.4, 0.75],
  [/thalam|basal_ganglia|brain_deep|amygdala|hippocampus|limbic/, '#c47f70', 0.6, 1],
  [/pituitary|pineal/, '#d5786a', 0.5, 1],
  [/medulla$|pons|midbrain|brainstem/, '#d4a28f', 0.6, 1],
  // the eye
  [/sclera|^eyes$/, '#f3efe8', 0.35, 1], [/iris/, '#6b4a2b', 0.5, 1], [/pupil/, '#0e0e10', 0.3, 1],
  [/^lens$/, '#e9f2ff', 0.1, 0.55], [/cornea/, '#e3f1ff', 0.05, 0.22], [/vitreous|aqueous/, '#dfeefa', 0.1, 0.12],
  [/conjunctiva/, '#f6e7e3', 0.3, 0.18], [/retina/, '#d4604c', 0.5, 1], [/choroid/, '#6a2a20', 0.5, 1],
  [/macula|fovea/, '#e2b54a', 0.5, 1], [/ciliary/, '#8a4b3a', 0.5, 1], [/eye_muscles/, '#a4433b', 0.6, 1], [/eye_drainage/, '#b4c9d8', 0.4, 0.8],
  // the ear
  [/outer_ear|^ear$/, '#e0b096', 0.65, 1], [/eardrum/, '#e8c6a6', 0.5, 0.9], [/cochlea|vestibule/, '#d8ad86', 0.55, 1], [/eustachian/, '#d6968a', 0.6, 1],
  // kidney and urine
  [/renal_cortex|kidney/, '#8c392e', 0.55, 1], [/renal_medulla|renal_columns/, '#b0584a', 0.55, 1], [/renal_papillae/, '#a24c3e', 0.55, 1],
  [/renal_capsule/, '#c87a5f', 0.5, 0.3], [/renal_pelvis|calyces/, '#e6c8a4', 0.5, 1], [/ureter|urethra|bladder/, '#ddb38a', 0.55, 1], [/adrenal/, '#e2a23b', 0.55, 1],
  // digestion
  [/liver|caudate|quadrate/, '#7a2e22', 0.5, 1], [/porta_hepatis/, '#c9a46a', 0.5, 1], [/impressions/, '#6e281d', 0.5, 1],
  [/gallbladder/, '#4f7a3a', 0.45, 1], [/bile/, '#8a9a3a', 0.5, 1], [/pancrea/, '#e5b787', 0.65, 1], [/spleen/, '#6c2a35', 0.5, 1],
  [/duodenum|jejunum|ileum|small_intestine|ileocecal/, '#d69a85', 0.6, 1], [/colon|caecum|appendix|rectum|large_intestine/, '#c88a6e', 0.6, 1],
  [/stomach/, '#d08876', 0.6, 1], [/esophagus|pharynx|larynx|nasal/, '#d38c80', 0.6, 1],
  // mouth
  [/tongue|taste/, '#c55e58', 0.55, 1], [/gums/, '#d97a78', 0.5, 1], [/palate|cheek|mouth/, '#d88a84', 0.55, 1], [/gland|salivary/, '#e2b88e', 0.6, 1],
  [/thyroid$/, '#b6524a', 0.55, 1], [/lymph/, '#8fb86a', 0.6, 1],
];

const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };

export function tintAnatomy(root, o = {}) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const name = (o.name || '').toLowerCase().replace(/_\d+$/, '');
    const r = RULES.find(([re]) => re.test(name)) || [null, '#d9c3b4', 0.6, 1];
    let [, col, rough, op] = r;
    if (o.ghost && name === o.ghost) op = 0.09;   // context only (the skin round a body system)
    const m = new THREE.MeshStandardMaterial({ color: col, roughness: rough, metalness: 0, transparent: op < 1, opacity: op, depthWrite: op >= 0.99, side: THREE.DoubleSide, envMapIntensity: 0.9 });
    if (/lobe|lung|liver|colon|cortex/.test(name)) { const k = hash(o.name); m.color.offsetHSL(((k % 7) - 3) * 0.004, 0, ((k % 5) - 2) * 0.018); }   // neighbouring segments in slightly different shades
    if (op < 1) o.renderOrder = 2;
    const old = o.material; o.material = m; if (old && old.dispose) old.dispose();
  });
}
