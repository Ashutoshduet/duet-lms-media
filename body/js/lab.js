// Organ Lab: one big, detailed organ on a pedestal with a guided tour.
// The model never changes size on a click; steps only change colours, cut-aways, glows and animations.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { asset, bakeMesh } from './body.js';
import { FlowSystem, PathCurve, haloTexture } from './flows.js';
import { Label } from './labels.js';
import { Magnifier } from './micro.js';
import { partInfo } from './content.js';
import { buildTooth, buildSkin } from './proc.js';

const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const smooth = (x) => x * x * (3 - 2 * x);
const win = (u, a, b) => (u < a || u > b ? 0 : Math.sin(((u - a) / (b - a)) * Math.PI));

// ---------------------------------------------------------------- lab catalogue
export const LAB_IDS = ['heart', 'eye', 'ear', 'brain', 'lungs', 'kidney', 'tooth', 'skin'];
export const LABS = {
  heart: { n: 10, color: '#e0414b', title: { en: 'Heart', hi: 'हृदय (दिल)', hg: 'Heart' }, frame: ['right_atrium', 'right_ventricle', 'left_atrium', 'left_ventricle'], disp: 0.4 },
  eye: { n: 8, color: '#7fd1c7', title: { en: 'Eye', hi: 'आँख', hg: 'Eye' }, frame: ['sclera'], disp: 0.34 },
  ear: { n: 9, color: '#9fb8ff', title: { en: 'Ear', hi: 'कान', hg: 'Ear' }, frame: ['outer_ear', 'cochlea'], disp: 0.44 },
  brain: { n: 10, color: '#b18cff', title: { en: 'Brain', hi: 'मस्तिष्क (दिमाग)', hg: 'Brain' }, frame: ['frontal_lobe', 'occipital_lobe', 'cerebellum', 'medulla'] },
  lungs: { n: 6, color: '#7fc8ff', title: { en: 'Lungs', hi: 'फेफड़े', hg: 'Lungs' }, frame: ['right_upper_lobe', 'left_lower_lobe', 'trachea', 'diaphragm'], disp: 0.46 },
  kidney: { n: 6, color: '#e5b04a', title: { en: 'Kidney', hi: 'वृक्क (गुर्दा)', hg: 'Kidney' }, frame: ['renal_capsule'], disp: 0.36 },
  tooth: { n: 6, color: '#f2efe6', title: { en: 'Tooth', hi: 'दाँत', hg: 'Tooth' }, frame: null },
  skin: { n: 6, color: '#f3c9ae', title: { en: 'Skin', hi: 'त्वचा', hg: 'Skin' }, frame: null },
};

// colour, opacity, roughness
const PAL = {
  heart: {
    right_atrium: ['#7d86c9', 1, 0.5], left_atrium: ['#d65a63', 1, 0.5], right_ventricle: ['#6c78c0', 1, 0.5], left_ventricle: ['#c9474f', 1, 0.5],
    interventricular_septum: ['#d99a9a', 1, 0.5], papillary_muscles: ['#c0565e', 1, 0.5],
    tricuspid_valve: ['#f3e0bd', 1, 0.45], mitral_valve: ['#f3e0bd', 1, 0.45], pulmonary_valve: ['#f6e7c8', 1, 0.45], aortic_valve: ['#f6e7c8', 1, 0.45],
    aorta_arch: ['#e0333d', 1, 0.38], carotid_arteries: ['#e0333d', 1, 0.38], subclavian_arteries: ['#e0333d', 1, 0.38],
    pulmonary_trunk: ['#4f68e0', 1, 0.38], pulmonary_arteries: ['#4f68e0', 1, 0.38], pulmonary_veins: ['#e85060', 1, 0.38],
    superior_vena_cava: ['#3557c4', 1, 0.38], inferior_vena_cava: ['#3557c4', 1, 0.38], jugular_veins: ['#3557c4', 1, 0.38],
    coronary_arteries: ['#ff4b4b', 1, 0.35], cardiac_veins: ['#4a6be0', 1, 0.35], coronary_sinus: ['#4a6be0', 1, 0.35],
  },
  eye: {
    sclera: ['#f4f1ea', 1, 0.4], cornea: ['#bfe6ff', 0.22, 0.05], iris: ['#6b4423', 1, 0.5], pupil: ['#050505', 1, 0.3], lens: ['#d8ecff', 0.55, 0.1],
    ciliary_body: ['#a0524a', 1, 0.5], ciliary_zonules: ['#efe2c8', 0.9, 0.5], aqueous: ['#cfeaff', 0.12, 0.05], vitreous: ['#dff2ff', 0.1, 0.05],
    retina: ['#e07a55', 1, 0.5], choroid: ['#7a2a2a', 1, 0.5], macula: ['#f2c14e', 1, 0.4], fovea: ['#ffdd55', 1, 0.4], optic_disc: ['#fff2cc', 1, 0.4],
    conjunctiva: ['#ffd9d9', 0.18, 0.2], eye_drainage: ['#7fd1c7', 1, 0.4], retinal_vessels: ['#d1232f', 1, 0.4], eye_muscles: ['#b4483f', 1, 0.6], optic_nerve: ['#f2d34b', 1, 0.45],
  },
  ear: {
    outer_ear: ['#f0bfa0', 1, 0.6], temporal_bone: ['#e9dfc9', 0.18, 0.6], eardrum: ['#f7d9b0', 0.95, 0.4], malleus: ['#f4ecd8', 1, 0.45], incus: ['#efe2c2', 1, 0.45], stapes: ['#fff4d8', 1, 0.45],
    cochlea: ['#c9a7ff', 1, 0.45], vestibule: ['#7fd1c7', 1, 0.45], eustachian_tube: ['#e8a0a8', 1, 0.5], hearing_nerve: ['#f2d34b', 1, 0.45], facial_nerve: ['#e5c86a', 1, 0.45],
  },
  brain: {
    frontal_lobe: ['#5b8def', 1, 0.6], parietal_lobe: ['#f2c14e', 1, 0.6], temporal_lobe: ['#5fbf77', 1, 0.6], occipital_lobe: ['#e0574f', 1, 0.6],
    motor_cortex: ['#ff8a3d', 1, 0.6], sensory_cortex: ['#ffd84d', 1, 0.6], limbic_lobe: ['#c48be0', 1, 0.6], insula: ['#7fd1c7', 1, 0.6],
    cerebellum: ['#c46cc0', 1, 0.6], midbrain: ['#9fb0c8', 1, 0.6], pons: ['#8aa0bd', 1, 0.6], medulla: ['#7891b0', 1, 0.6],
    thalamus: ['#f08bc0', 1, 0.5], hypothalamus: ['#ff6f91', 1, 0.5], pituitary: ['#e7a47a', 1, 0.5], pineal_gland: ['#d8c27a', 1, 0.5],
    basal_ganglia: ['#9fd17a', 1, 0.5], hippocampus: ['#ffb347', 1, 0.5], amygdala: ['#ff7a7a', 1, 0.5], corpus_callosum: ['#f4efe2', 1, 0.5],
    fornix: ['#e6dcc4', 1, 0.5], ventricles: ['#6fc3ff', 0.85, 0.3], choroid_plexus: ['#d1232f', 1, 0.5], visual_pathway: ['#f2d34b', 1, 0.5],
  },
  lungs: {
    right_upper_lobe: ['#f0a3ab', 0.55, 0.75], right_middle_lobe: ['#ec9aa4', 0.55, 0.75], right_lower_lobe: ['#e6919c', 0.55, 0.75],
    left_upper_lobe: ['#f0a3ab', 0.55, 0.75], left_lower_lobe: ['#e6919c', 0.55, 0.75],
    trachea: ['#e8e2d4', 1, 0.5], thyroid_cartilage: ['#bfd6dc', 1, 0.45], cricoid_cartilage: ['#bfd6dc', 1, 0.45],
    main_bronchi: ['#f2ecdf', 1, 0.5], lobar_bronchi: ['#f2ecdf', 1, 0.5], segmental_bronchi: ['#f2ecdf', 1, 0.5],
    pulmonary_arteries: ['#4f68e0', 1, 0.4], pulmonary_veins: ['#e85060', 1, 0.4], diaphragm: ['#b5524c', 0.4, 0.6],
  },
  kidney: {
    renal_capsule: ['#b0563f', 1, 0.45], renal_cortex: ['#c4614c', 1, 0.5], renal_columns: ['#d07a62', 1, 0.5], renal_medulla: ['#8f2f3a', 1, 0.5],
    renal_papillae: ['#e3a07a', 1, 0.5], renal_calyces: ['#f0cf86', 1, 0.45], renal_pelvis: ['#e8c06d', 1, 0.45], ureters: ['#e9cf7a', 1, 0.45],
    renal_artery: ['#e0333d', 1, 0.4], renal_vein: ['#3557c4', 1, 0.4],
  },
};

// tour steps. focus: parts that glow; dim: other parts fade; cut: cut-away on; yaw/pitch: model view
const H_CH = ['right_atrium', 'right_ventricle', 'left_atrium', 'left_ventricle'];
const H_VAL = ['tricuspid_valve', 'mitral_valve', 'pulmonary_valve', 'aortic_valve'];
const STEPS = {
  heart: [
    { yaw: 0.35, pitch: 0.08, focus: ['coronary_arteries', 'cardiac_veins'], labels: ['right_atrium', 'right_ventricle', 'left_ventricle', 'aorta_arch', 'pulmonary_trunk', 'superior_vena_cava'], beat: 1 },
    { cut: true, focus: [...H_CH, 'interventricular_septum'], labels: [...H_CH, 'interventricular_septum'], beat: 0.5 },
    { cut: true, dim: true, focus: ['superior_vena_cava', 'inferior_vena_cava', 'right_atrium', 'tricuspid_valve', 'right_ventricle'], flows: ['vc', 'rv_in'], labels: ['superior_vena_cava', 'inferior_vena_cava', 'right_atrium', 'tricuspid_valve', 'right_ventricle'], beat: 0.5 },
    { cut: true, dim: true, focus: ['right_ventricle', 'pulmonary_valve', 'pulmonary_trunk', 'pulmonary_arteries'], flows: ['rv_in', 'rv_out', 'pa'], labels: ['right_ventricle', 'pulmonary_valve', 'pulmonary_trunk', 'pulmonary_arteries'], beat: 0.5 },
    { cut: true, dim: true, yaw: -0.45, focus: ['pulmonary_veins', 'left_atrium', 'mitral_valve', 'left_ventricle'], flows: ['pv', 'lv_in'], labels: ['pulmonary_veins', 'left_atrium', 'mitral_valve', 'left_ventricle'], beat: 0.5 },
    { cut: true, dim: true, focus: ['left_ventricle', 'aortic_valve', 'aorta_arch', 'carotid_arteries', 'subclavian_arteries'], flows: ['lv_in', 'lv_out', 'aorta'], labels: ['left_ventricle', 'aortic_valve', 'aorta_arch', 'carotid_arteries'], beat: 0.5 },
    { cut: true, dim: true, focus: [...H_VAL, 'papillary_muscles', 'chordae_tendineae'], extras: ['chords'], valves: true, labels: [...H_VAL, 'chordae_tendineae', 'papillary_muscles'], beat: 0.35 },
    { cut: true, dim: true, focus: ['sa_node', 'av_node', 'bundle_of_his', 'purkinje_fibres'], extras: ['conduction', 'ecg'], labels: ['sa_node', 'av_node', 'bundle_of_his', 'purkinje_fibres'], beat: 0.35 },
    { yaw: 0.35, pitch: 0.08, focus: ['coronary_arteries', 'cardiac_veins', 'coronary_sinus'], flows: ['cor'], labels: ['coronary_arteries', 'cardiac_veins', 'coronary_sinus'], beat: 1 },
    { cut: true, flows: ['vc', 'rv_in', 'rv_out', 'pa', 'pv', 'lv_in', 'lv_out', 'aorta'], extras: ['ecg', 'phase', 'conduction'], valves: true, labels: [...H_CH], beat: 0.3 },
  ],
  eye: [
    { yaw: 0.6, pitch: 0.15, labels: ['cornea', 'iris', 'sclera', 'optic_nerve', 'eye_muscles'] },
    { cut: true, yaw: -1.5708, hide: ['eye_muscles'], focus: ['cornea'], rays: true, labels: ['cornea', 'aqueous', 'lens'] },
    { yaw: 0, pitch: 0, hide: ['eye_muscles'], focus: ['iris', 'pupil'], extras: ['irisdisc', 'sun'], labels: ['iris', 'pupil'] },
    { cut: true, yaw: -1.5708, hide: ['eye_muscles'], focus: ['lens', 'ciliary_body', 'ciliary_zonules'], rays: true, extras: ['accom'], labels: ['lens', 'ciliary_body', 'ciliary_zonules'] },
    { cut: true, yaw: -1.5708, hide: ['eye_muscles'], focus: ['retina'], rays: true, extras: ['image'], flows: ['signal'], labels: ['retina', 'choroid', 'vitreous', 'sclera'] },
    { cut: true, yaw: -1.5708, hide: ['eye_muscles'], focus: ['fovea', 'macula', 'optic_disc'], rays: true, labels: ['fovea', 'macula', 'optic_disc', 'retinal_vessels'] },
    { cut: true, yaw: -2.1, hide: ['eye_muscles'], focus: ['optic_nerve', 'optic_disc'], flows: ['signal', 'optic'], labels: ['optic_nerve', 'optic_disc'] },
    { yaw: 0.7, pitch: 0.2, focus: ['eye_muscles', 'conjunctiva'], extras: ['look'], labels: ['eye_muscles', 'conjunctiva', 'eye_drainage'] },
  ],
  ear: [
    { yaw: -0.75, pitch: 0.1, labels: ['outer_ear', 'eardrum', 'malleus', 'cochlea', 'vestibule', 'eustachian_tube', 'hearing_nerve'] },
    { yaw: -0.75, pitch: 0.1, focus: ['outer_ear', 'ear_canal'], extras: ['waves'], labels: ['outer_ear', 'ear_canal'] },
    { yaw: -0.75, pitch: 0.1, dim: true, focus: ['eardrum', 'ear_canal'], extras: ['waves', 'drum'], labels: ['eardrum', 'ear_canal'] },
    { yaw: -0.4, pitch: 0.15, dim: true, focus: ['malleus', 'incus', 'stapes'], extras: ['waves', 'drum'], labels: ['malleus', 'incus', 'stapes'] },
    { yaw: -0.2, pitch: 0.2, dim: true, focus: ['cochlea', 'oval_window', 'hair_cells', 'stapes'], extras: ['drum', 'hair'], flows: ['fluid'], labels: ['cochlea', 'oval_window', 'hair_cells'] },
    { yaw: 0.2, pitch: 0.15, dim: true, focus: ['hearing_nerve', 'cochlea', 'auditory_cortex'], extras: ['hair', 'cortex'], flows: ['fluid', 'nerve'], labels: ['hearing_nerve', 'auditory_cortex'] },
    { yaw: -0.2, pitch: 0.25, dim: true, focus: ['vestibule'], extras: ['turn'], flows: ['balance'], labels: ['vestibule'] },
    { yaw: 0.6, pitch: 0.05, dim: true, focus: ['eustachian_tube', 'eardrum'], flows: ['tube'], labels: ['eustachian_tube', 'eardrum'] },
    { yaw: -0.75, pitch: 0.1, focus: ['hair_cells', 'cochlea', 'eardrum'], extras: ['waves', 'loud', 'drum', 'hair'], flows: ['fluid'], labels: ['hair_cells', 'eardrum', 'outer_ear'] },
  ],
  brain: [
    { yaw: 0.6, pitch: 0.12, labels: ['frontal_lobe', 'parietal_lobe', 'temporal_lobe', 'occipital_lobe', 'cerebellum', 'medulla'], flows: ['sparks'] },
    { yaw: 0, pitch: 0.9, extras: ['split'], focus: ['corpus_callosum'], flows: ['cross'], labels: ['corpus_callosum'] },
    { yaw: 0.9, pitch: 0.1, dim: true, focus: ['frontal_lobe'], flows: ['sparks_front'], labels: ['frontal_lobe'] },
    { yaw: 0.9, pitch: 0.45, dim: true, focus: ['motor_cortex', 'sensory_cortex'], flows: ['motor'], labels: ['motor_cortex', 'sensory_cortex'] },
    { yaw: 1.3, pitch: 0.1, dim: true, focus: ['parietal_lobe', 'temporal_lobe'], labels: ['parietal_lobe', 'temporal_lobe'] },
    { yaw: 2.6, pitch: 0.15, dim: true, focus: ['occipital_lobe', 'visual_pathway'], flows: ['vision'], labels: ['occipital_lobe', 'visual_pathway'] },
    { yaw: 2.4, pitch: -0.15, dim: true, focus: ['cerebellum'], flows: ['cereb'], labels: ['cerebellum'] },
    { yaw: 1.4, pitch: -0.1, dim: true, ghostCortex: true, focus: ['midbrain', 'pons', 'medulla'], flows: ['motor'], labels: ['midbrain', 'pons', 'medulla'] },
    { yaw: 1.1, pitch: 0.15, dim: true, ghostCortex: true, focus: ['thalamus', 'hypothalamus', 'pituitary', 'hippocampus', 'amygdala', 'basal_ganglia'], labels: ['thalamus', 'hypothalamus', 'pituitary', 'hippocampus', 'basal_ganglia'] },
    { yaw: 0.6, pitch: 0.12, micro: 'neuron', flows: ['sparks', 'motor'], labels: ['frontal_lobe'] },
  ],
  lungs: [
    { yaw: 0.25, breathe: 1, labels: ['right_upper_lobe', 'right_middle_lobe', 'right_lower_lobe', 'left_upper_lobe', 'left_lower_lobe', 'trachea'], flows: ['air'] },
    { yaw: 0.15, breathe: 1, dim: true, ghostLobes: true, focus: ['trachea', 'main_bronchi', 'lobar_bronchi', 'segmental_bronchi', 'bronchioles'], flows: ['air'], labels: ['trachea', 'main_bronchi', 'lobar_bronchi', 'segmental_bronchi', 'bronchioles'] },
    { yaw: 0.5, breathe: 1.6, focus: ['diaphragm'], flows: ['air'], labels: ['diaphragm', 'pleura'] },
    { yaw: 0.25, breathe: 1, ghostLobes: true, micro: 'alveoli', focus: ['alveoli'], flows: ['air'], labels: ['alveoli', 'bronchioles'] },
    { yaw: -0.2, breathe: 1, ghostLobes: true, focus: ['pulmonary_arteries', 'pulmonary_veins'], flows: ['blood'], labels: ['pulmonary_arteries', 'pulmonary_veins'] },
    { yaw: 0.25, breathe: 1, flows: ['air', 'blood'], labels: ['trachea', 'right_upper_lobe', 'left_upper_lobe'] },
  ],
  kidney: [
    { yaw: -0.5, labels: ['renal_capsule', 'renal_artery', 'renal_vein', 'ureters'], flows: ['in', 'out'] },
    { yaw: 0, cut: true, labels: ['renal_cortex', 'renal_medulla', 'renal_columns', 'renal_papillae', 'renal_calyces', 'renal_pelvis'] },
    { yaw: 0, cut: true, dim: true, micro: 'nephron', focus: ['renal_cortex', 'renal_medulla'], labels: ['renal_cortex', 'renal_medulla', 'nephron'] },
    { yaw: 0, cut: true, dim: true, focus: ['renal_papillae', 'renal_calyces', 'renal_pelvis', 'ureters'], flows: ['urine'], labels: ['renal_papillae', 'renal_calyces', 'renal_pelvis', 'ureters'] },
    { yaw: 0, cut: true, dim: true, focus: ['renal_artery', 'renal_vein'], flows: ['in', 'out', 'blood'], labels: ['renal_artery', 'renal_vein'] },
    { yaw: -0.3, cut: true, flows: ['in', 'out', 'blood', 'urine'], labels: ['renal_cortex', 'renal_pelvis', 'ureters'] },
  ],
};

const CUT = {
  heart: { n: [0, 0.18, 1], c: -0.014, parts: [...H_CH, 'interventricular_septum', 'aorta_arch', 'pulmonary_trunk', 'superior_vena_cava', 'inferior_vena_cava', 'coronary_arteries', 'cardiac_veins', 'coronary_sinus', 'pulmonary_arteries', 'pulmonary_veins'] },
  eye: { n: [1, 0, 0], c: null, parts: '*' },
  kidney: { n: [0, 0, 1], c: 0.004, parts: ['renal_capsule', 'renal_cortex', 'renal_columns', 'renal_medulla', 'renal_papillae', 'renal_calyces', 'renal_pelvis'] },
};
const CORTEX = ['frontal_lobe', 'parietal_lobe', 'temporal_lobe', 'occipital_lobe', 'motor_cortex', 'sensory_cortex', 'insula', 'limbic_lobe'];
const LOBES = ['right_upper_lobe', 'right_middle_lobe', 'right_lower_lobe', 'left_upper_lobe', 'left_lower_lobe'];

// ---------------------------------------------------------------- small helpers
function canvasSprite(draw, w = 128, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
}
function sunSprite() {
  return canvasSprite((x, w) => {
    x.translate(w / 2, w / 2);
    x.strokeStyle = '#ffd84d'; x.lineWidth = 7; x.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.moveTo(Math.cos(a) * 34, Math.sin(a) * 34); x.lineTo(Math.cos(a) * 56, Math.sin(a) * 56); x.stroke(); }
    x.fillStyle = '#ffd84d'; x.beginPath(); x.arc(0, 0, 26, 0, 7); x.fill();
  });
}
function treeSprite() {
  return canvasSprite((x, w, h) => {
    x.fillStyle = '#8a5a2b'; x.fillRect(w / 2 - 9, h * 0.62, 18, h * 0.34);
    x.fillStyle = '#4caf50'; x.beginPath(); x.moveTo(w / 2, 6); x.lineTo(w - 14, h * 0.66); x.lineTo(14, h * 0.66); x.closePath(); x.fill();
  });
}
function tube(points, r, color, seg) {
  const c = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : V3(p))), false, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(c, seg || Math.max(8, points.length * 8), r, 6, false), new THREE.MeshStandardMaterial({ color, roughness: 0.45 }));
}

// ---------------------------------------------------------------- Lab
export class Lab {
  constructor(app) {
    this.app = app;
    this.group = new THREE.Group(); this.group.name = 'lab'; this.group.visible = false; // placed by the app
    this.root = new THREE.Group(); this.group.add(this.root); // scale k
    this.spin = new THREE.Group(); this.root.add(this.spin); // view yaw/pitch
    this.model = new THREE.Group(); this.spin.add(this.model); // offset so the organ is centred
    this.labels = new THREE.Group(); this.model.add(this.labels);
    this.extras = new THREE.Group(); this.model.add(this.extras);
    this.flows = new FlowSystem(5000); this.model.add(this.flows.points);
    this.flows.drivers = { beat: 1, fill: 1, eject: 1, in: 1, out: 1, wave: 1 };
    this.mag = new Magnifier(); this.mag.group.position.set(0.34, 0.06, 0.02); this.mag.group.scale.setScalar(0.13 / 1.28); this.group.add(this.mag.group);
    this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1e6); // world-space cut plane (far away = off)
    this.localPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.cutOn = 0; this.cutTarget = 0;
    this.buildPedestal();
    this.cache = {};
    this.id = null; this.step = -1; this.t = 0;
    this.selected = null; this.hovered = null;
    this.yaw = 0; this.pitch = 0; this.yawT = 0; this.pitchT = 0; this.userYaw = 0;
    this.labelMul = 1;
  }

  buildPedestal() {
    const p = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.035, 64), new THREE.MeshStandardMaterial({ color: '#1b2433', roughness: 0.35, metalness: 0.3 }));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.005, 8, 96), new THREE.MeshBasicMaterial({ color: '#7fd1ff', transparent: true, opacity: 0.8 }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.019;
    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.2, 48), new THREE.MeshBasicMaterial({ map: haloTexture(), color: '#7fd1ff', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = 0.02;
    p.add(disc, ring, glow);
    const logo = new THREE.TextureLoader().load('./brand/duet-stem-logo-light.png'); logo.colorSpace = THREE.SRGBColorSpace;
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2 * 165 / 1024), new THREE.MeshBasicMaterial({ map: logo, transparent: true, depthWrite: false }));
    plaque.position.set(0, 0, 0.232); plaque.rotation.y = 0; p.add(plaque);
    p.position.y = -0.27;
    this.pedestal = p; this.group.add(p);
    this.ring = ring;
  }

  get def() { return LABS[this.id]; }
  stepId(i = this.step) { return `lab-${this.id}-${i + 1}`; }

  // ------------------------------------------------------------ open / close
  async open(id, onProgress) {
    this.close();
    this.id = id; this.loading = true;
    const L = this.cache[id] || (this.cache[id] = await this.load(id, onProgress));
    if (this.id !== id) return false;
    this.L = L; this.loading = false;
    this.model.add(L.group); this.group.add(L.side);
    this.model.position.copy(L.mid).negate();
    this.k = (this.def.disp || 0.42) / L.size;
    this.root.scale.setScalar(this.k);
    this.flows.mat.uniforms.uModel.value = this.k;
    this.defineFlows(L);
    this.group.visible = true;
    this.ring.material.color.set(this.def.color);
    return true;
  }
  close() {
    if (this.L) { this.model.remove(this.L.group); this.group.remove(this.L.side); }
    this.flows.set([]); for (const [, s] of this.flows.active) for (const st of s.streams) st.clear(); this.flows.active.clear(); this.flows.used = 0; this.flows.free = [];
    this.flows.defs = {};
    this.labels.clear(); this.mag.show(null);
    this.L = null; this.id = null; this.step = -1; this.selected = null; this.hovered = null;
    this.group.visible = false;
  }

  async load(id, onProgress) {
    const L = { group: new THREE.Group(), side: new THREE.Group(), parts: {}, meshes: [], fx: {}, paths: {}, centers: {} };
    if (id === 'tooth' || id === 'skin') {
      const P = id === 'tooth' ? buildTooth() : buildSkin();
      L.group.add(P.group); L.paths = P.paths; L.fx.proc = P;
      P.group.traverse((o) => { if (o.isMesh && o.userData.pid) this.register(L, o.userData.pid, o, o.material); });
      L.steps = P.steps; L.size = P.size; L.mid = new THREE.Vector3(...P.mid);
      for (const [pid, list] of Object.entries(L.parts)) { const b = new THREE.Box3(); for (const m of list) b.expandByObject(m); L.centers[pid] = b.getCenter(new THREE.Vector3()); }
      for (const [pid, p] of Object.entries(P.anchors || {})) L.centers[pid] = p.isVector3 ? p.clone() : V3(p);
      return L;
    }
    const [gltf, meta] = await Promise.all([
      new Promise((res, rej) => { const ld = new GLTFLoader(); ld.setMeshoptDecoder(MeshoptDecoder); ld.load(asset(`./models/labs/${id}.glb`), res, (e) => onProgress && e.total && onProgress(e.loaded / e.total), rej); }),
      fetch(`./models/labs/${id}.json`).then((r) => r.json()),
    ]);
    const list = []; gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => { if (o.isMesh) list.push(o); });
    const pal = PAL[id] || {};
    for (const o of list) {
      const pid = o.name.replace(/_\d+$/, '');
      bakeMesh(o);
      const [c, op, r] = pal[pid] || ['#cccccc', 1, 0.5];
      const m = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, transparent: true, opacity: op, depthWrite: op > 0.99, side: THREE.DoubleSide, envMapIntensity: 0.9 });
      o.userData.pid = pid; o.material = m; o.frustumCulled = false;
      L.group.add(o); this.register(L, pid, o, m);
    }
    L.steps = STEPS[id];
    L.meta = meta;
    for (const [k, v] of Object.entries(meta.paths || {})) L.paths[k] = v.map(V3);
    for (const [k, v] of Object.entries(meta.centers || {})) L.centers[k] = V3(v);
    // frame on the main parts so the organ fills the pedestal
    const fb = new THREE.Box3();
    for (const pid of this.def.frame || []) for (const m of L.parts[pid] || []) { m.geometry.computeBoundingBox(); fb.union(m.geometry.boundingBox); }
    if (fb.isEmpty()) for (const m of L.meshes) { m.geometry.computeBoundingBox(); fb.union(m.geometry.boundingBox); }
    const sz = fb.getSize(new THREE.Vector3());
    L.size = Math.max(sz.x, sz.y, sz.z); L.mid = fb.getCenter(new THREE.Vector3());
    this.buildExtras(id, L);
    return L;
  }

  register(L, pid, mesh, mat) {
    (L.parts[pid] ||= []).push(mesh); L.meshes.push(mesh);
    mesh.userData.pid = pid;
    mat.userData.base = { color: mat.color.clone(), opacity: mat.opacity, emissive: mat.emissive ? mat.emissive.clone() : null };
    mat.clippingPlanes = [this.plane];
    // hemisphere tint for the brain (uSplit)
    if (this.id === 'brain') {
      const u = (L.splitU ||= { uSplit: { value: 0 }, uGap: { value: 0 } });
      const gap = CORTEX.includes(pid) || pid === 'cerebellum';
      mat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, u);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLabP; uniform float uGap;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLabP = position;' + (gap ? '\ntransformed.x += (position.x > 0.0 ? 1.0 : -1.0) * uGap;' : ''));
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLabP; uniform float uSplit;')
          .replace('#include <color_fragment>', '#include <color_fragment>\nif (uSplit > 0.001) diffuseColor.rgb = mix(diffuseColor.rgb, vLabP.x > 0.0 ? vec3(0.32,0.55,1.0) : vec3(1.0,0.6,0.25), 0.6 * uSplit);');
      };
      mat.customProgramCacheKey = () => 'labsplit' + (gap ? 'g' : '');
    }
  }

  // procedural pieces that make each lab come alive
  buildExtras(id, L) {
    const P = L.paths, C = L.centers, meta = L.meta, X = L.fx, add = (o) => { L.group.add(o); return o; };
    const reg = (pid, mesh) => { mesh.material.transparent = true; this.register(L, pid, mesh, mesh.material); add(mesh); return mesh; };
    if (id === 'heart') {
      // chordae tendineae: thin strings between papillary muscles and valve flaps
      const pos = []; for (const [a, b] of meta.chords || []) pos.push(...a, ...b);
      const chg = new THREE.BufferGeometry(); chg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const ch = new THREE.LineSegments(chg, new THREE.LineBasicMaterial({ color: '#fff6e0', transparent: true, opacity: 0.95 }));
      X.chords = add(ch); ch.visible = false;
      // pickable proxy for the chordae
      const cm = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: '#fff6e0' }));
      const segs = (meta.chords || []).map(([a, b]) => new THREE.TubeGeometry(new THREE.LineCurve3(V3(a), V3(b)), 1, 0.00045, 4, false));
      if (segs.length) { cm.geometry = mergeGeoms(segs); reg('chordae_tendineae', cm); X.chordMesh = cm; }
      // conduction system
      const g = new THREE.Group(); X.conduction = g; add(g); g.visible = false;
      const sa = V3(meta.nodes.sa), av = V3(meta.nodes.av);
      const node = (p, pid, col) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 16, 12), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4 })); m.position.copy(p); this.register(L, pid, m, m.material); g.add(m); return m; };
      X.saNode = node(sa, 'sa_node', '#ffe066'); X.avNode = node(av, 'av_node', '#ffb347');
      const his = tube(P.his, 0.0011, '#ffd84d'); this.register(L, 'bundle_of_his', his, his.material); g.add(his);
      const hl = tube(P.his_l, 0.0008, '#ffd84d'), hr = tube(P.his_r, 0.0008, '#ffd84d');
      this.register(L, 'bundle_of_his', hl, hl.material); this.register(L, 'bundle_of_his', hr, hr.material); g.add(hl, hr);
      for (let i = 0; i < 12; i++) if (P['purk' + i]) { const t = tube(P['purk' + i], 0.0005, '#d8f27a'); this.register(L, 'purkinje_fibres', t, t.material); g.add(t); }
      // electric pulses along the system
      const la = C.left_atrium, ra = C.right_atrium;
      const cur = (pts) => PathCurve.smoothJoin([PathCurve.fromPoints(pts)]);
      X.pulses = [
        ...[[sa, ra], [sa, sa.clone().lerp(la, 0.5).add(new THREE.Vector3(0, 0.006, 0)), la], [sa, sa.clone().lerp(av, 0.5), av]].map((p) => ({ c: cur(p), a: 0.0, b: 0.12 })),
        { c: cur(P.his), a: 0.16, b: 0.21 }, { c: cur(P.his_l), a: 0.21, b: 0.26 }, { c: cur(P.his_r), a: 0.21, b: 0.26 },
        ...Array.from({ length: 12 }, (_, i) => P['purk' + i]).filter(Boolean).map((p) => ({ c: cur(p), a: 0.25, b: 0.31 })),
      ];
      for (const p of X.pulses) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: '#fff6a0', transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(0.009); s.renderOrder = 12; s.visible = false; p.s = s; g.add(s); }
      // ECG strip and phase text sit beside the heart (in stage space, not scaled)
      X.ecg = new ECG(); X.ecg.mesh.position.set(0, 0.36, 0); X.ecg.mesh.visible = false; L.side.add(X.ecg.mesh);
      X.phase = new PhaseTag(); X.phase.sprite.position.set(0, 0.27, 0.02); X.phase.sprite.visible = false; L.side.add(X.phase.sprite);
      // pivots for the beat
      X.piv = {}; for (const k of [...H_CH, 'interventricular_septum', 'papillary_muscles']) X.piv[k] = C[k];
    }
    if (id === 'eye') {
      // iris + pupil disc with an animated pupil
      const ib = new THREE.Box3(); for (const m of L.parts.iris) { m.geometry.computeBoundingBox(); ib.union(m.geometry.boundingBox); }
      const r = Math.max(ib.max.x - ib.min.x, ib.max.y - ib.min.y) / 2 * 0.98;
      const mat = new THREE.ShaderMaterial({
        uniforms: { uPupil: { value: 0.35 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `varying vec2 vUv; uniform float uPupil;
          void main(){ vec2 p = vUv*2.0-1.0; float r = length(p); if (r > 1.0) discard; float a = atan(p.y, p.x);
            vec3 iris = mix(vec3(0.30,0.18,0.09), vec3(0.62,0.42,0.2), 0.5+0.5*sin(a*46.0 + r*12.0));
            iris = mix(iris, vec3(0.45,0.55,0.35), 0.25*smoothstep(0.3,0.0,abs(r-0.62)));
            vec3 col = r < uPupil ? vec3(0.008) : iris * (0.8 + 0.2*smoothstep(uPupil, 1.0, r));
            col = mix(col, vec3(0.12,0.07,0.04), smoothstep(0.86, 1.0, r));
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 48), mat);
      disc.position.set((ib.min.x + ib.max.x) / 2, (ib.min.y + ib.max.y) / 2, ib.max.z + 0.0002);
      disc.visible = false; disc.userData.pid = 'iris'; add(disc); X.iris = disc;
      const sun = sunSprite(); sun.position.set(disc.position.x + 0.012, disc.position.y + 0.012, disc.position.z + 0.03); sun.scale.setScalar(0.012); sun.visible = false; add(sun); X.sun = sun;
      // light rays (lines) + inverted image
      X.rayLines = [];
      const rg = new THREE.Group(); X.rays = rg; add(rg); rg.visible = false;
      for (let i = 0; i < 6; i++) {
        const geo = new THREE.BufferGeometry().setFromPoints(P['ray' + i]);
        const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#fff3a0', transparent: true, opacity: 0.85, depthTest: false }));
        ln.renderOrder = 11; rg.add(ln); X.rayLines.push(ln);
      }
      X.rayBase = [0, 1, 2, 3, 4, 5].map((i) => P['ray' + i].map((p) => p.clone()));
      const obj = treeSprite(); obj.scale.setScalar(0.007); obj.position.copy(P.ray0[0]).setY(C.lens.y); obj.position.z += 0.004; rg.add(obj); X.object = obj;
      const img = treeSprite(); img.material = img.material.clone(); img.material.rotation = Math.PI; img.scale.setScalar(0.0022); img.position.copy(C.fovea); img.position.z += 0.0008; img.visible = false; add(img); X.image = img;
      X.lensC = C.lens.clone();
    }
    if (id === 'ear') {
      const canal = meta.canal.map(V3);
      const ec = tube([canal[0], canal[0].clone().lerp(canal[1], 0.5), canal[1]], 0.0032, '#f0b8a0', 16);
      ec.material.transparent = true; ec.material.opacity = 0.35; ec.material.depthWrite = false; reg('ear_canal', ec);
      const foot = P.ossicles[P.ossicles.length - 1];
      const ow = new THREE.Mesh(new THREE.TorusGeometry(0.0013, 0.00035, 8, 24), new THREE.MeshStandardMaterial({ color: '#ff9f6b', emissive: '#ff9f6b', emissiveIntensity: 0.3 }));
      ow.position.copy(foot); ow.lookAt(P.cochlea[3]); reg('oval_window', ow);
      // hair cells: tiny beads along the cochlea spiral
      const hc = new THREE.InstancedMesh(new THREE.SphereGeometry(0.00028, 8, 6), new THREE.MeshStandardMaterial({ color: '#ffe08a', emissive: '#ffe08a', emissiveIntensity: 0.2 }), 40);
      const cc = PathCurve.fromPoints(P.cochlea); const v = new THREE.Vector3(), mtx = new THREE.Matrix4();
      for (let i = 0; i < 40; i++) { cc.at(cc.length * (0.05 + 0.9 * i / 39), v); mtx.makeTranslation(v.x, v.y, v.z); hc.setMatrixAt(i, mtx); }
      reg('hair_cells', hc); X.hair = hc; X.cochlea = cc;
      const ac = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 16, 12), new THREE.MeshStandardMaterial({ color: '#b18cff', emissive: '#b18cff', emissiveIntensity: 0.35, transparent: true, opacity: 0.85 }));
      ac.position.copy(P.nerve[P.nerve.length - 1]); reg('auditory_cortex', ac); X.cortex = ac; ac.visible = false;
      // sound wave rings
      X.wave = PathCurve.smoothJoin([PathCurve.fromPoints(P.sound)]);
      X.rings = [];
      for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 40), new THREE.MeshBasicMaterial({ color: '#7fd1ff', transparent: true, opacity: 0.7, depthWrite: false })); m.visible = false; add(m); X.rings.push(m); }
      X.normal = V3(meta.normal);
      X.vib = {}; for (const k of ['eardrum', 'malleus', 'incus', 'stapes']) X.vib[k] = L.parts[k];
    }
    if (id === 'lungs') {
      X.lungC = new THREE.Vector3(0, 0.03, -0.01);
      const bb = new THREE.Box3(); for (const m of L.parts.diaphragm || []) { m.geometry.computeBoundingBox(); bb.union(m.geometry.boundingBox); }
      X.diaTop = bb.max.y;
      // pointers for bronchioles / alveoli / pleura: ends of airways and lobe surfaces
      const seg = Object.entries(P).filter(([k]) => k.startsWith('segmental_bronchi:')).map(([, v]) => v);
      const ends = seg.map((s) => s[s.length - 1]);
      const far = ends.sort((a, b) => b.x - a.x)[0] || new THREE.Vector3();
      L.centers.bronchioles = far.clone(); L.centers.alveoli = far.clone().add(new THREE.Vector3(0.012, -0.01, 0.01));
      const ru = L.parts.right_upper_lobe && L.parts.right_upper_lobe[0];
      if (ru) { ru.geometry.computeBoundingBox(); const b = ru.geometry.boundingBox; L.centers.pleura = new THREE.Vector3(b.min.x + 0.004, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2); }
      const mk = (pid, p, col) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.004, 12, 10), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.4, transparent: true, opacity: 0.9 })); m.position.copy(p); reg(pid, m); return m; };
      X.markers = [mk('bronchioles', L.centers.bronchioles, '#fff6e0'), mk('alveoli', L.centers.alveoli, '#ff9fb0')];
    }
    if (id === 'kidney') {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 12, 10), new THREE.MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffd27a', emissiveIntensity: 0.5 }));
      const cor = L.centers.renal_cortex; m.position.copy(cor).add(new THREE.Vector3(0.026, 0.02, 0.006)); reg('nephron', m); L.centers.nephron = m.position.clone();
    }
    if (id === 'brain') {
      // the skull fades in around the brain (from the body model, same coordinates)
      const sk = this.app.body && this.app.body.parts.skull;
      if (sk && meta.center) {
        const m = new THREE.Mesh(sk.geometry, new THREE.MeshStandardMaterial({ color: '#e9dfc9', roughness: 0.6, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
        m.position.set(-meta.center[0], -meta.center[1], -meta.center[2]); m.renderOrder = 5; m.visible = false; L.group.add(m); X.skull = m;
      }
      // sample points on the cortex surfaces for sparks
      L.surf = {};
      for (const pid of [...CORTEX, 'cerebellum']) {
        const pts = []; for (const m of L.parts[pid] || []) { const a = m.geometry.attributes.position; const step = Math.max(1, (a.count / 400) | 0); for (let i = 0; i < a.count; i += step) pts.push(new THREE.Vector3().fromBufferAttribute(a, i)); }
        L.surf[pid] = pts;
      }
    }
    // cut planes and lights for each part
    for (const [pid, list] of Object.entries(L.parts)) for (const m of list) m.userData.pid = pid;
  }

  // ------------------------------------------------------------ flows
  defineFlows(L) {
    const F = this.flows, P = L.paths, id = this.id, s = L.size;
    const cur = (pts, r) => PathCurve.smoothJoin([PathCurve.fromPoints(pts, r)]);
    const def = (k, fn) => F.define(k, fn);
    const ps = s * 0.016, sp = s * 0.22;
    const BLUE = '#5a78ff', RED = '#ff3040', AIR = '#bff4ff', CO2 = '#a9b0bd', YEL = '#ffd84d', SIG = '#fff3a0';
    const many = (prefix) => Object.keys(P).filter((k) => k.startsWith(prefix)).map((k) => P[k]);
    const num = (prefix) => Object.keys(P).filter((k) => new RegExp('^' + prefix + '\\d+$').test(k)).map((k) => P[k]);
    const spark = (pts, n, len, col, center) => {
      const cs = [];
      for (let i = 0; i < n && pts.length > 2; i++) {
        const a = pts[(Math.random() * pts.length) | 0]; let b = null;
        for (let k = 0; k < 25; k++) { const q = pts[(Math.random() * pts.length) | 0]; const d = a.distanceTo(q); if (d > len * 0.5 && d < len * 1.6) { b = q; break; } }
        if (!b) continue;
        const mid = a.clone().lerp(b, 0.5); if (center) mid.add(mid.clone().sub(center).normalize().multiplyScalar(len * 0.25));
        cs.push(cur([a, mid, b], 0.001));
      }
      return { curves: cs, color: col, size: ps * 0.9, speed: sp * 0.9, density: 1.6 / len, fade: 0.25, max: 400 };
    };
    if (id === 'heart') {
      const rv = P.ra_rv, lv = P.la_lv;
      def('vc', () => ({ curves: [cur(P.svc), cur(P.ivc), ...many('jugular_veins').map((p) => cur([...p, P.svc[0]]))], color: BLUE, size: ps, speed: sp * 0.35, density: 160 / s, spread: 0.6, drive: 'fill' }));
      def('rv_in', () => ({ curves: [cur(rv.slice(0, 4))], color: BLUE, size: ps, speed: sp * 0.3, density: 160 / s, spread: 0.9, drive: 'fill' }));
      def('rv_out', () => ({ curves: [cur(rv.slice(3))], color: BLUE, size: ps, speed: sp * 0.45, density: 160 / s, spread: 0.8, drive: 'eject' }));
      def('pa', () => ({ curves: [cur(P.pa_l), cur(P.pa_r)], color: BLUE, size: ps, speed: sp * 0.5, density: 140 / s, spread: 0.7, drive: 'eject' }));
      def('pv', () => ({ curves: [0, 1, 2, 3].map((i) => cur(P['pv' + i])), color: RED, size: ps, speed: sp * 0.3, density: 160 / s, spread: 0.7, drive: 'fill' }));
      def('lv_in', () => ({ curves: [cur(lv.slice(0, 4))], color: RED, size: ps, speed: sp * 0.3, density: 160 / s, spread: 0.9, drive: 'fill' }));
      def('lv_out', () => ({ curves: [cur(lv.slice(3))], color: RED, size: ps, speed: sp * 0.5, density: 160 / s, spread: 0.8, drive: 'eject' }));
      def('aorta', () => ({ curves: [cur(P.aorta), ...many('carotid_arteries').map((p) => cur(p)), ...many('subclavian_arteries').map((p) => cur(p))], color: RED, size: ps, speed: sp * 0.55, density: 140 / s, spread: 0.7, drive: 'eject', max: 900 }));
      def('cor', () => [spark((L.meta.sparks.coronary || []).map(V3), 40, s * 0.12, RED, L.centers.left_ventricle), spark((L.meta.sparks.cardiac_veins || []).map(V3), 24, s * 0.12, BLUE, L.centers.left_ventricle)]);
    }
    if (id === 'eye') {
      def('rays', () => ({ curves: [0, 1, 2, 3, 4, 5].map((i) => cur(P['ray' + i], 0.0002)), color: SIG, size: ps * 0.9, speed: sp * 0.6, density: 160 / s, spread: 0.2 }));
      def('signal', () => spark((L.meta.sparks.retina || []).map(V3), 30, s * 0.12, SIG, L.centers.vitreous));
      def('optic', () => ({ curves: [cur(P.optic, 0.0008)], color: SIG, size: ps * 1.1, speed: sp * 0.7, density: 200 / s, spread: 0.6 }));
    }
    if (id === 'ear') {
      def('fluid', () => ({ curves: [cur(P.cochlea, 0.0005)], color: '#c9a7ff', size: ps * 0.7, speed: sp * 0.25, density: 300 / s, spread: 0.6, drive: 'wave' }));
      def('nerve', () => ({ curves: [cur(P.nerve, 0.0008)], color: SIG, size: ps * 0.9, speed: sp * 0.7, density: 160 / s, spread: 0.6 }));
      def('tube', () => [{ curves: [cur(P.tube, 0.001)], color: AIR, size: ps, speed: sp * 0.25, density: 160 / s, spread: 0.7 }, { curves: [cur(P.tube, 0.001).reversed()], color: AIR, size: ps * 0.8, speed: sp * 0.25, density: 80 / s, spread: 0.7 }]);
      def('balance', () => spark((L.meta.sparks.vestibule || []).map(V3), 30, s * 0.06, '#7fffe0', L.centers.vestibule));
    }
    if (id === 'brain') {
      const S = L.surf, all = [...CORTEX.flatMap((k) => S[k] || [])];
      const bc = new THREE.Vector3(0, 0.2, -0.01);
      def('sparks', () => spark(all, 90, s * 0.14, '#e8dcff', bc));
      def('sparks_front', () => spark(S.frontal_lobe || [], 60, s * 0.12, '#cfe0ff', bc));
      def('motor', () => ({ curves: ['motor_l', 'motor_r'].map((k) => cur(P[k], 0.002)), color: '#ffb347', size: ps * 1.1, speed: sp * 0.6, density: 120 / s, spread: 0.5 }));
      def('vision', () => ({ curves: ['vision_l', 'vision_r'].map((k) => cur(P[k], 0.002)), color: SIG, size: ps * 1.1, speed: sp * 0.5, density: 120 / s, spread: 0.5 }));
      def('cereb', () => [spark(S.cerebellum || [], 50, s * 0.08, '#ffc6f0', bc), { curves: ['cereb_l', 'cereb_r'].map((k) => cur(P[k], 0.002)), color: '#ffc6f0', size: ps, speed: sp * 0.5, density: 120 / s, spread: 0.5 }]);
      def('cross', () => ({ curves: [...many('cross').map((p) => cur(p, 0.002)), ...many('cross').map((p) => cur(p, 0.002).reversed())], color: '#fff3a0', size: ps, speed: sp * 0.45, density: 120 / s, spread: 0.6 }));
    }
    if (id === 'lungs') {
      const air = [P.trachea, ...many('main_bronchi:'), ...many('lobar_bronchi:'), ...many('segmental_bronchi:')].map((p) => cur(p, 0.002));
      def('air', () => [{ curves: air, color: AIR, size: ps * 0.8, speed: sp * 0.35, density: 40 / s, spread: 0.6, drive: 'in', max: 1400 }, { curves: air.map((c) => c.reversed()), color: CO2, size: ps * 0.8, speed: sp * 0.35, density: 30 / s, spread: 0.6, drive: 'out', max: 1000 }]);
      def('blood', () => [{ curves: many('pulmonary_arteries:').map((p) => cur(p, 0.002)), color: BLUE, size: ps * 0.8, speed: sp * 0.3, density: 30 / s, spread: 0.6, max: 1000 }, { curves: many('pulmonary_veins:').map((p) => cur(p, 0.002)), color: RED, size: ps * 0.8, speed: sp * 0.3, density: 30 / s, spread: 0.6, max: 1000 }]);
    }
    if (id === 'kidney') {
      def('in', () => ({ curves: [cur(P.artery_in, 0.002)], color: RED, size: ps * 0.9, speed: sp * 0.4, density: 160 / s, spread: 0.6, drive: 'beat' }));
      def('out', () => ({ curves: [cur(P.vein_out, 0.002)], color: BLUE, size: ps * 0.9, speed: sp * 0.3, density: 160 / s, spread: 0.6 }));
      def('blood', () => [{ curves: num('art').map((p) => cur(p.slice(-4), 0.0015)), color: RED, size: ps * 0.7, speed: sp * 0.3, density: 120 / s, spread: 0.5, drive: 'beat' },
        { curves: num('vein').map((p) => cur(p.slice(0, 4), 0.0015)), color: BLUE, size: ps * 0.7, speed: sp * 0.25, density: 120 / s, spread: 0.5 }]);
      def('urine', () => [{ curves: num('urine').map((p) => cur(p, 0.0015)), color: YEL, size: ps * 0.8, speed: sp * 0.2, density: 120 / s, spread: 0.5 }, { curves: [cur(P.ureter, 0.0015)], color: YEL, size: ps * 0.8, speed: sp * 0.25, density: 120 / s, spread: 0.5 }]);
    }
    if (L.fx.proc && L.fx.proc.flows) for (const [k, fn] of Object.entries(L.fx.proc.flows)) def(k, () => fn(cur, ps, sp, s));
  }

  // ------------------------------------------------------------ steps
  showStep(i) {
    const L = this.L; if (!L) return;
    this.step = THREE.MathUtils.clamp(i, 0, this.def.n - 1);
    const st = this.st = L.steps[this.step] || {};
    this.t = 0; this.selected = null;
    this.focus = new Set(st.focus || []);
    this.hide = new Set(st.hide || []);
    this.extrasOn = new Set(st.extras || []);
    this.cutTarget = st.cut ? 1 : 0;
    this.yawT = st.yaw ?? 0; this.pitchT = st.pitch ?? 0; this.userYaw = 0;
    // looks
    for (const [pid, list] of Object.entries(L.parts)) for (const m of list) this.look(pid, m);
    // flows
    const fl = [...(st.flows || [])]; if (this.id === 'eye' && st.rays) fl.push('rays');
    this.flows.set(fl);
    // extras
    const X = L.fx;
    if (X.chords) X.chords.visible = this.extrasOn.has('chords');
    if (X.chordMesh) X.chordMesh.visible = this.extrasOn.has('chords');
    if (X.conduction) X.conduction.visible = this.extrasOn.has('conduction');
    if (X.ecg) X.ecg.mesh.visible = this.extrasOn.has('ecg');
    if (X.phase) X.phase.sprite.visible = this.extrasOn.has('phase');
    if (X.iris) { X.iris.visible = this.extrasOn.has('irisdisc'); X.sun.visible = this.extrasOn.has('sun'); }
    if (X.rays) X.rays.visible = !!st.rays;
    if (X.image) X.image.visible = this.extrasOn.has('image');
    if (X.rings) for (const r of X.rings) r.visible = false;
    if (X.cortex) X.cortex.visible = this.extrasOn.has('cortex');
    if (L.splitU) L.splitU.uSplit.value = this.extrasOn.has('split') ? 1 : 0;
    if (X.skull) { X.skull.visible = this.id === 'brain' && this.step === 0; X.skull.material.opacity = 0; }
    if (X.proc && X.proc.step) X.proc.step(this.step, this);
    this.mag.show(st.micro || null, this.app.lang);
    this.buildLabels();
    // cut plane in model space
    const cut = CUT[this.id];
    if (cut) {
      const n = new THREE.Vector3(...cut.n).normalize();
      const c = cut.c ?? (L.centers.lens ? L.centers.lens.x : 0);
      this.localPlane.set(n.negate(), c);
      // which materials are cut
      for (const [pid, list] of Object.entries(L.parts)) for (const m of list) m.userData.cut = cut.parts === '*' || cut.parts.includes(pid);
    }
  }

  look(pid, m) {
    const st = this.st || {}, mat = m.material; const b = mat.userData.base; if (!b) return;
    let op = b.opacity;
    const inFocus = this.focus.has(pid);
    if (st.dim && this.focus.size && !inFocus) op = Math.min(op, 0.12);
    if (st.ghostCortex && CORTEX.includes(pid)) op = 0.07;
    if (st.ghostLobes && LOBES.includes(pid)) op = 0.1;
    if (this.id === 'ear' && pid === 'temporal_bone') op = st.dim ? 0.06 : 0.14;
    if (this.id === 'eye' && pid === 'eye_muscles' && st.cut) op = 0;
    if (this.extrasOn && this.extrasOn.has('irisdisc') && (pid === 'iris' || pid === 'pupil')) op = 0;
    mat.opacity = op; mat.depthWrite = op > 0.98;
    m.visible = op > 0.01 && !this.hide.has(pid) && m.userData.procVisible !== false;
    m.renderOrder = op > 0.98 ? 0 : 3;
    m.userData.glow = inFocus;
  }

  buildLabels() {
    this.labels.clear();
    const L = this.L, st = this.st; if (!L || !st) return;
    const lang = this.app.lang;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(this.pitchT, this.yawT, 0, 'YXZ'));
    const qi = q.clone().invert();
    const items = (st.labels || []).map((pid) => ({ pid, info: partInfo(pid, lang), at: this.anchor(pid) })).filter((x) => x.info && x.at);
    // left/right in view space, stacked so tags never overlap
    const vs = items.map((x) => ({ ...x, v: x.at.clone().sub(L.mid).applyQuaternion(q) }));
    const sides = { 1: [], [-1]: [] };
    vs.forEach((x, i) => { let s = Math.sign(x.v.x) || (i % 2 ? 1 : -1); if (Math.abs(x.v.x) < 0.04 * L.size) s = sides[1].length <= sides[-1].length ? 1 : -1; sides[s].push(x); });
    const k = 1 / this.k, H = 0.026, M = this.labelMul;
    for (const s of [1, -1]) {
      const list = sides[s].sort((a, b) => b.v.y - a.v.y);
      let lastY = Infinity;
      for (const x of list) {
        const edge = (L.size * 0.5 + 0.0) * this.k; // to the side of the organ, in display metres
        let y = x.v.y * this.k + 0.02; if (y > lastY - H * M * 1.35) y = lastY - H * M * 1.35; lastY = y;
        const off = new THREE.Vector3(s * (edge + 0.03) - x.v.x * this.k, y - x.v.y * this.k, 0.02).applyQuaternion(qi);
        const lb = new Label([x.info.name, x.info.alt], { height: H * M, offset: off, cx: s > 0 ? 0 : 1, cy: 0.5, small: 22 });
        lb.position.copy(x.at); lb.setScale(k); lb.userData.pid = x.pid; this.labels.add(lb);
      }
    }
  }
  setLang() { this.buildLabels(); if (this.mag.scene) this.mag.setLang(this.app.lang); }

  anchor(pid) {
    const L = this.L; if (!L) return null;
    if (L.centers[pid]) return L.centers[pid].clone();
    const list = L.parts[pid]; if (!list) return null;
    const b = new THREE.Box3(); for (const m of list) b.expandByObject(m);
    return this.model.worldToLocal(b.getCenter(new THREE.Vector3()));
  }

  // parts of this lab, for the list in the menu
  partList() { return this.L ? Object.keys(this.L.parts) : []; }

  // ------------------------------------------------------------ picking
  pick(raycaster) {
    if (!this.L) return null;
    const ms = this.L.meshes.filter((m) => m.visible && m.material.opacity > 0.1);
    const hits = raycaster.intersectObjects(ms, false).filter((h) => !this.plane || this.plane.constant > 1e5 || !h.object.userData.cut || this.plane.distanceToPoint(h.point) >= 0);
    if (!hits.length) return null;
    const h = hits[0];
    return { pid: h.object.userData.pid, point: this.model.worldToLocal(h.point.clone()) };
  }
  setHover(pid) { this.hovered = pid; }
  // a tag where the student pointed
  pickLabel(pid, point) {
    if (this.pl) { this.model.remove(this.pl); this.pl.dispose(); this.pl = null; }
    const info = pid && partInfo(pid, this.app.lang); if (!info || !point) return;
    const lb = new Label([info.name, info.alt], { height: 0.03, offset: new THREE.Vector3(0.05, 0.05, 0.03), cx: 0, cy: 0.5, small: 22, border: 'rgba(255,214,140,0.8)' });
    lb.position.copy(point); lb.setScale(1 / this.k); this.model.add(lb); this.pl = lb;
  }
  select(pid) { this.selected = pid; this.selT = 0; }

  // ------------------------------------------------------------ frame
  update(dt, t, pointScale, boost = 1) {
    if (!this.L || !this.group.visible) return;
    this.t += dt;
    const L = this.L, X = L.fx, st = this.st || {};
    // view: smooth turn to the step's angle (+ user's own turn)
    const kk = 1 - Math.exp(-dt * 2.5);
    this.yaw += (this.yawT + this.userYaw - this.yaw) * kk; this.pitch += (this.pitchT - this.pitch) * kk;
    this.spin.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    // cut plane follows the model
    this.cutOn += (this.cutTarget - this.cutOn) * Math.min(1, dt * 2);
    this.group.updateMatrixWorld(true);
    if (this.cutOn > 0.01) {
      const lp = this.localPlane.clone(); lp.constant += (1 - this.cutOn) * L.size * 1.2;
      this.plane.copy(lp).applyMatrix4(this.model.matrixWorld);
    } else this.plane.set(new THREE.Vector3(0, 0, 1), 1e6);
    const arr = (this.planeArr ||= [this.plane]);
    for (const m of L.meshes) { const cl = m.userData.cut && this.cutOn > 0.01; const want = cl ? arr : null; if (m.material.clippingPlanes !== want) m.material.clippingPlanes = want; }
    // glows
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2);
    for (const m of L.meshes) {
      const mat = m.material; if (!mat.emissive) continue;
      const pid = m.userData.pid, b = mat.userData.base;
      let e = 0; let col = b.color;
      if (m.userData.glow) e = 0.18 + 0.2 * pulse;
      if (pid === this.hovered) e = Math.max(e, 0.3);
      if (pid === this.selected) { e = 0.35 + 0.3 * pulse; }
      mat.emissive.copy(col).multiplyScalar(e);
      if (b.emissive) mat.emissive.add(b.emissive);
    }
    const D = this.flows.drivers;
    if (this.id === 'heart') this.heart(dt, t, st, X, D);
    if (this.id === 'eye') this.eye(dt, t, st, X);
    if (this.id === 'ear') this.ear(dt, t, st, X, D);
    if (this.id === 'lungs') this.lungs(dt, t, st, X, D);
    if (X.skull && X.skull.visible) X.skull.material.opacity = Math.min(0.2, this.t * 0.05);
    if (L.splitU) L.splitU.uGap.value += ((this.extrasOn.has('split') ? L.size * 0.06 : 0) - L.splitU.uGap.value) * Math.min(1, dt * 1.5);
    if (this.id === 'kidney') { D.beat = 0.4 + 1.4 * Math.max(0, Math.sin(t * 7.6)); }
    if (X.proc && X.proc.update) X.proc.update(dt, t, this);
    this.flows.update(dt);
    this.flows.mat.uniforms.uScale.value = pointScale;
    this.flows.mat.uniforms.uModel.value = this.root.getWorldScale(new THREE.Vector3()).x * boost;
    this.mag.update(dt, t, this.app.viewCamera());
  }

  heart(dt, t, st, X, D) {
    const rate = st.beat ?? 1, T = 0.83 / rate;
    const u = (this.t % T) / T;
    const atr = win(u, 0.0, 0.14), ven = win(u, 0.17, 0.5);
    const lastU = this._u ?? 0; this._u = u;
    if (lastU < 0.17 && u >= 0.17) this.app.audio.lub();
    if (lastU < 0.5 && u >= 0.5) this.app.audio.dub();
    const P = this.L.parts;
    const sc = (pid, s) => { for (const m of P[pid] || []) { const c = X.piv[pid]; m.scale.setScalar(s); m.position.copy(c).multiplyScalar(1 - s); } };
    sc('right_atrium', 1 - 0.05 * atr); sc('left_atrium', 1 - 0.05 * atr);
    for (const k of ['right_ventricle', 'left_ventricle', 'interventricular_septum', 'papillary_muscles']) sc(k, 1 - 0.045 * ven);
    const avOpen = u > 0.5 || u < 0.17, slOpen = u > 0.2 && u < 0.48;
    D.fill = avOpen ? 1.5 : 0.25; D.eject = slOpen ? 2.4 : 0.12; D.beat = 0.4 + 1.6 * ven;
    if (st.valves) {
      const flash = (pid, on) => { for (const m of P[pid] || []) { m.material.emissive.setRGB(on ? 0.55 : 0.05, on ? 0.45 : 0.05, on ? 0.15 : 0.02); } };
      flash('tricuspid_valve', !avOpen); flash('mitral_valve', !avOpen); flash('pulmonary_valve', !slOpen && u > 0.48 && u < 0.62); flash('aortic_valve', !slOpen && u > 0.48 && u < 0.62);
      if (X.chords) X.chords.material.color.setHSL(0.12, 0.8, avOpen ? 0.8 : 0.95);
    }
    if (X.conduction && X.conduction.visible) {
      for (const p of X.pulses) {
        const on = u >= p.a && u <= p.b; p.s.visible = on;
        if (on) { const f = (u - p.a) / (p.b - p.a); p.c.at(p.c.length * f, p.s.position); }
      }
      const g = (m, on) => m.material.emissiveIntensity = on ? 1.6 : 0.3;
      g(X.saNode, u < 0.05); g(X.avNode, u > 0.1 && u < 0.17);
    }
    if (X.ecg.mesh.visible) X.ecg.draw(u, this.app.lang);
    if (X.phase.sprite.visible) X.phase.set(u < 0.15 ? 0 : u < 0.5 ? 1 : 2, this.app.lang);
  }

  eye(dt, t, st, X) {
    const P = this.L.parts;
    if (X.iris && X.iris.visible) {
      const cyc = (this.t % 8) / 8; const bright = cyc < 0.5;
      const target = bright ? 0.2 : 0.55;
      X.iris.material.uniforms.uPupil.value += (target - X.iris.material.uniforms.uPupil.value) * Math.min(1, dt * 2.2);
      X.sun.material.opacity += ((bright ? 1 : 0.15) - X.sun.material.opacity) * Math.min(1, dt * 3);
      X.sun.scale.setScalar(0.012 * (bright ? 1.1 : 0.8));
    }
    // lens gets fatter for near objects
    if (this.extrasOn.has('accom')) {
      const near = 0.5 - 0.5 * Math.cos(this.t * 0.9);
      for (const m of P.lens || []) { const c = X.lensC; m.scale.set(1, 1, 1 + 0.35 * near); m.position.set(0, 0, c.z * -0.35 * near); }
      X.object.position.z = X.rayBase[0][0].z + 0.004 - 0.022 * near;
      const ob = X.object.position;
      X.rayLines.forEach((ln, i) => { const pts = X.rayBase[i].map((p) => p.clone()); pts[0].set(ob.x, ob.y + (pts[1].y - ob.y) * 0.1, ob.z); ln.geometry.setFromPoints(pts); });
    } else if (P.lens) { for (const m of P.lens) { m.scale.set(1, 1, 1); m.position.set(0, 0, 0); } }
    // eyes look around
    if (this.extrasOn.has('look')) this.userYawAnim = Math.sin(this.t * 0.8) * 0.35; else this.userYawAnim = 0;
    this.spin.rotation.y += this.userYawAnim || 0;
  }

  ear(dt, t, st, X, D) {
    const on = (k) => this.extrasOn.has(k);
    const loud = on('loud');
    // sound rings travel into the ear canal
    if (on('waves')) {
      const c = X.wave; const n = X.rings.length;
      X.rings.forEach((r, i) => {
        const f = ((this.t * 0.35 + i / n) % 1);
        const p = new THREE.Vector3(); c.at(c.length * f, p); const d = new THREE.Vector3(); c.dir(c.length * f, d);
        r.visible = true; r.position.copy(p); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
        r.scale.setScalar(THREE.MathUtils.lerp(0.0085, 0.0022, smooth(f)) * (loud ? 1.3 : 1));
        r.material.color.set(loud ? '#ff5050' : '#7fd1ff'); r.material.opacity = 0.75 * Math.sin(f * Math.PI);
      });
    }
    const w = Math.sin(this.t * 2 * Math.PI * (loud ? 9 : 6));
    const amp = (loud ? 2 : 1) * this.L.size * 0.006;
    const vib = (pid, a, dir) => { for (const m of X.vib[pid] || []) m.position.copy(dir).multiplyScalar(a * w); };
    if (on('drum')) {
      const n = X.normal; vib('eardrum', amp, n); vib('malleus', amp * 0.8, n); vib('incus', amp * 0.6, n);
      const P = this.L.paths.ossicles; const sd = P[4].clone().sub(P[3]).normalize(); vib('stapes', amp * 0.5, sd);
    } else for (const k of Object.keys(X.vib)) vib(k, 0, X.normal);
    D.wave = on('drum') ? 1.4 + 0.8 * w : 1;
    if (X.hair) X.hair.material.emissiveIntensity = on('hair') ? 0.3 + (loud ? 1.4 : 0.9) * Math.max(0, w) : 0.2;
    if (on('turn')) this.spin.rotation.y += Math.sin(this.t * 1.3) * 0.4;
  }

  lungs(dt, t, st, X, D) {
    const deep = (st.breathe ?? 1) > 1.2, per = deep ? 5.6 : 4.2;
    const ph = (this.t % per) / per; const inh = ph < 0.42;
    const f = inh ? smooth(ph / 0.42) : 1 - smooth((ph - 0.42) / 0.58);
    const lastPh = this._bp ?? 0; this._bp = ph;
    if (lastPh > 0.9 && ph < 0.1) this.app.audio.breathIn(per * 0.42);
    if (lastPh < 0.42 && ph >= 0.42) this.app.audio.breathOut(per * 0.5);
    const s = 1 + (deep ? 0.07 : 0.045) * f;
    const P = this.L.parts, c = X.lungC;
    for (const pid of LOBES) for (const m of P[pid] || []) { m.scale.set(s, 1 + (s - 1) * 1.4, s); m.position.set(c.x * (1 - s), c.y * (1 - (1 + (s - 1) * 1.4)), c.z * (1 - s)); }
    for (const m of P.diaphragm || []) { const sy = 1 - (deep ? 0.22 : 0.14) * f; m.scale.set(1, sy, 1); m.position.set(0, X.diaTop * (1 - sy) - this.L.size * (deep ? 0.05 : 0.03) * f, 0); }
    D.in = inh ? 1.8 : 0.05; D.out = inh ? 0.05 : 1.6;
  }
}

// ---------------------------------------------------------------- heart helpers
function mergeGeoms(list) {
  const pos = [], nor = [], idx = []; let off = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); }
    const ix = g.index ? g.index.array : [...Array(p.count).keys()];
    for (const i of ix) idx.push(i + off);
    off += p.count; g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
  return g;
}

const ECG_T = { en: 'ECG: the heart\'s electric signal', hi: 'ई.सी.जी.: हृदय का विद्युत संकेत', hg: 'ECG: heart ka electric signal' };
class ECG {
  constructor() {
    this.c = document.createElement('canvas'); this.c.width = 512; this.c.height = 200;
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26 * 200 / 512), new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false }));
    this.mesh.renderOrder = 15; this.trace = new Float32Array(512); this.x = 0; this.lastU = 0;
  }
  v(u) { // PQRST shape over one beat
    const g = (m, s, a) => a * Math.exp(-((u - m) ** 2) / (2 * s * s));
    return g(0.07, 0.025, 0.12) - g(0.165, 0.006, 0.12) + g(0.18, 0.008, 1.0) - g(0.2, 0.008, 0.25) + g(0.42, 0.04, 0.25);
  }
  draw(u, lang) {
    const steps = 4; for (let i = 0; i < steps; i++) { this.x = (this.x + 1) % 512; this.trace[this.x] = this.v((u + i / steps * 0.004) % 1); }
    const x = this.c.getContext('2d'), W = 512, H = 200;
    x.clearRect(0, 0, W, H);
    x.fillStyle = 'rgba(8,16,22,0.88)'; x.beginPath(); x.roundRect(2, 2, W - 4, H - 4, 22); x.fill();
    x.strokeStyle = 'rgba(80,200,140,0.15)'; x.lineWidth = 1;
    for (let gx = 20; gx < W; gx += 24) { x.beginPath(); x.moveTo(gx, 40); x.lineTo(gx, H - 12); x.stroke(); }
    for (let gy = 40; gy < H; gy += 24) { x.beginPath(); x.moveTo(12, gy); x.lineTo(W - 12, gy); x.stroke(); }
    x.font = '600 24px "Noto Sans Devanagari", "Noto Sans", sans-serif'; x.fillStyle = '#9ff0c0'; x.fillText(ECG_T[lang] || ECG_T.en, 20, 30);
    x.strokeStyle = '#6dffa8'; x.lineWidth = 3; x.beginPath();
    for (let i = 0; i < W - 24; i++) { const k = (this.x - (W - 24) + i + 1 + 512) % 512; const y = 140 - this.trace[k] * 80; if (i === 0) x.moveTo(12 + i, y); else x.lineTo(12 + i, y); }
    x.stroke();
    this.tex.needsUpdate = true;
  }
}
const PHASE = [
  { en: '1  Atria squeeze', hi: '१  आलिंद सिकुड़ते हैं', hg: '1  Atria squeeze karte hain' },
  { en: '2  Ventricles squeeze  (lub … dub)', hi: '२  निलय सिकुड़ते हैं  (लब … डब)', hg: '2  Ventricles squeeze karte hain  (lub … dub)' },
  { en: '3  Heart relaxes and fills', hi: '३  हृदय ढीला होकर भरता है', hg: '3  Heart relax hokar bharta hai' },
];
class PhaseTag {
  constructor() {
    this.c = document.createElement('canvas'); this.c.width = 640; this.c.height = 80;
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.tex, depthTest: false, transparent: true }));
    this.sprite.scale.set(0.3, 0.3 * 80 / 640, 1); this.sprite.renderOrder = 31; this.cur = -1;
  }
  set(i, lang) {
    if (i === this.cur && lang === this.lang) return; this.cur = i; this.lang = lang;
    const x = this.c.getContext('2d'); x.clearRect(0, 0, 640, 80);
    x.fillStyle = ['rgba(180,80,95,0.92)', 'rgba(200,50,60,0.92)', 'rgba(60,90,160,0.92)'][i]; x.beginPath(); x.roundRect(2, 2, 636, 76, 24); x.fill();
    x.font = '600 34px "Noto Sans Devanagari", "Noto Sans", sans-serif'; x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.textAlign = 'center';
    x.fillText(PHASE[i][lang] || PHASE[i].en, 320, 42);
    this.tex.needsUpdate = true;
  }
}
