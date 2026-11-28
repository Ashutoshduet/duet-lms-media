// DUET Little Learners: fetch and lighten the open-licence 3D models listed in assets.json, into early/models/<id>.glb.
// Each model is downloaded from the Objaverse mirror of Sketchfab (CC0 / CC BY / CC BY-SA only), then either
//  - "light": cleaned (spec-gloss -> metal-rough, unlit -> lit), joined, simplified to the triangle budget, textures
//    resized to WebP; or
//  - "rebake": re-meshed and its colour baked onto one new atlas (for heavy photogrammetry; needs rebake.mjs); or
//  - "skin": as light, but the skeleton and animations are kept (no join / flatten).
// Every model is turned (rot), sat on the ground, centred and scaled so its largest side is 1 (the app sizes it).
// The raw download is deleted after use (KEEPDL=1 keeps it). Writes devtools/early/prep_report.json.
// usage: node devtools/early/prep.mjs [id ...]      env: DUET_TOOLS (folder with rebake.mjs), DL (download folder)
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { center, dedup, prune, flatten, join, weld, simplify, textureCompress, meshopt, metalRough, getBounds, unpartition } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
await MeshoptSimplifier.ready; await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const HERE = path.dirname(new URL(import.meta.url).pathname), REPO = path.resolve(HERE, '../..');
const TOOLS = process.env.DUET_TOOLS || '/tmp/claude-0/agent-ocean/tools2';
const DL = process.env.DL || '/tmp/claude-0/agent-early/dl'; fs.mkdirSync(DL, { recursive: true });
const OUT = path.join(REPO, 'early', 'models'); fs.mkdirSync(OUT, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.decoder': await draco3d.createDecoderModule(), 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const SPEC = JSON.parse(fs.readFileSync(path.join(HERE, 'assets.json'), 'utf8'));
const REPF = path.join(HERE, 'prep_report.json'); const REP = fs.existsSync(REPF) ? JSON.parse(fs.readFileSync(REPF, 'utf8')) : {};
let PATHS = null; const pathsOf = () => PATHS || (PATHS = JSON.parse(fs.readFileSync(process.env.OBJ_PATHS || '/tmp/claude-0/agent-early/work/paths.json', 'utf8')));
const only = process.argv.slice(2);
const tris = (doc) => { let n = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); n += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; } return Math.round(n); };

async function download(uid) {
  const f = path.join(DL, uid + '.glb'); if (fs.existsSync(f) && fs.statSync(f).size > 1000) return f;
  const rel = pathsOf()[uid]; if (!rel) throw new Error('not in the Objaverse list: ' + uid);
  execFileSync('curl', ['-sSL', '--fail', '--retry', '3', '-o', f + '.part', 'https://huggingface.co/datasets/allenai/objaverse/resolve/main/' + rel], { stdio: 'inherit' });
  fs.renameSync(f + '.part', f); return f;
}
function turn(doc, rot) { // rot: [[axis, deg], ...] applied in order
  if (!rot || !rot.length) return; const sc = doc.getRoot().listScenes()[0];
  let q = [0, 0, 0, 1]; const mul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
  for (const [ax, deg] of rot) { const a = deg * Math.PI / 360, s = Math.sin(a), c = Math.cos(a); q = mul(ax === 'x' ? [s, 0, 0, c] : ax === 'y' ? [0, s, 0, c] : [0, 0, s, c], q); }
  const pivot = doc.createNode('turn').setRotation(q); for (const n of sc.listChildren()) { sc.removeChild(n); pivot.addChild(n); } sc.addChild(pivot);
}
function unitScale(doc) { // largest side 1, after the turn; then sit on the ground at the centre
  const sc = doc.getRoot().listScenes()[0]; const b = getBounds(sc); const d = Math.max(b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]) || 1;
  const pivot = doc.createNode('unit').setScale([1 / d, 1 / d, 1 / d]); for (const n of sc.listChildren()) { sc.removeChild(n); pivot.addChild(n); } sc.addChild(pivot);
}
function cleanMaterials(doc, a) {
  for (const m of doc.getRoot().listMaterials()) {
    const ul = m.getExtension('KHR_materials_unlit'); if (ul) { m.setExtension('KHR_materials_unlit', null); m.setRoughnessFactor(a.rough ?? 0.7); m.setMetallicFactor(0); }
    if (a.rough != null && !m.getMetallicRoughnessTexture()) m.setRoughnessFactor(a.rough);
    if (a.metal != null && !m.getMetallicRoughnessTexture()) m.setMetallicFactor(a.metal);
    for (const e of ['KHR_materials_transmission', 'KHR_materials_volume', 'KHR_materials_sheen', 'KHR_materials_clearcoat', 'KHR_materials_specular', 'KHR_materials_ior', 'KHR_materials_iridescence']) m.setExtension(e, null);
    if (a.noNormal) m.setNormalTexture(null);
    if (a.noEmissive) { m.setEmissiveTexture(null); m.setEmissiveFactor([0, 0, 0]); }
    if (m.getAlphaMode() === 'BLEND' && !a.keepBlend) m.setAlphaMode(a.alphaMask ? 'MASK' : 'OPAQUE');
  }
}
async function one(a) {
  const t0 = Date.now(); let src;
  if (a.uid) src = await download(a.uid); else if (a.file) src = path.resolve(REPO, a.file); else throw new Error('no source');
  let work = src;
  if (a.mode === 'rebake') {
    work = path.join(DL, a.id + '.rebake.glb');
    const env = { ...process.env, ...(a.env || {}) };
    execFileSync('node', [path.join(TOOLS, 'rebake.mjs'), src, work, String(a.tris || 20000), String(a.tex || 1024)], { stdio: 'inherit', env, cwd: TOOLS });
  }
  const doc = await io.read(work); const before = tris(doc);
  // drop meshes by name pattern or node index (a stand, a mat, a splash)
  if (a.dropNodes) { const rx = new RegExp(a.dropNodes, 'i'); for (const n of doc.getRoot().listNodes()) if (n.getMesh() && rx.test((n.getName() || '') + ' ' + (n.getMesh().getName() || ''))) { n.setMesh(null); } }
  if (a.keepNodes) { const rx = new RegExp(a.keepNodes, 'i'); for (const n of doc.getRoot().listNodes()) if (n.getMesh() && !rx.test((n.getName() || '') + ' ' + (n.getMesh().getName() || ''))) n.setMesh(null); }
  await doc.transform(metalRough());
  cleanMaterials(doc, a);
  const skinned = doc.getRoot().listSkins().length > 0, anims = doc.getRoot().listAnimations().length;
  if (!a.keepAnim && !skinned) for (const an of doc.getRoot().listAnimations()) an.dispose();
  turn(doc, a.rot); unitScale(doc);
  const steps = [dedup(), prune()];
  if (!skinned) steps.push(flatten(), join({ keepNamed: false }));
  steps.push(weld({}));
  const tmax = a.mode === 'rebake' ? 1e9 : (a.tris || 40000);
  if (before > tmax * 1.1) steps.push(simplify({ simplifier: MeshoptSimplifier, ratio: tmax / before, error: a.err || 0.002, lockBorder: !!a.lockBorder }));
  steps.push(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [a.tex || 1024, a.tex || 1024], quality: a.q || 82, slots: /^(baseColor|emissive)/ }));
  steps.push(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [Math.min(512, a.tex || 1024), Math.min(512, a.tex || 1024)], quality: 85, slots: /^(?!baseColor|emissive)/ }));
  steps.push(prune(), center({ pivot: 'below' }), unpartition(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await doc.transform(...steps);
  const out = path.join(OUT, a.id + '.glb'); await io.write(out, doc);
  const sc = doc.getRoot().listScenes()[0]; const b = getBounds(sc);
  const prims = doc.getRoot().listMeshes().reduce((n, m) => n + m.listPrimitives().length, 0);
  const texs = doc.getRoot().listTextures().map((t) => (t.getSize() || []).join('x'));
  const r = { tris: tris(doc), from: before, prims, materials: doc.getRoot().listMaterials().length, textures: texs, skinned, anims: doc.getRoot().listAnimations().length,
    size: b.max.map((v, i) => +(v - b.min[i]).toFixed(3)), bytes: fs.statSync(out).size, secs: Math.round((Date.now() - t0) / 1000) };
  REP[a.id] = r; fs.writeFileSync(REPF, JSON.stringify(REP, null, 1));
  console.log(a.id.padEnd(14), `${r.from}->${r.tris} tris`, prims + ' prims', texs.join(','), (r.bytes / 1e3).toFixed(0) + ' KB', skinned ? 'SKIN ' + r.anims : '', r.secs + 's');
  if (a.uid && !process.env.KEEPDL) { try { fs.unlinkSync(src); } catch (e) {} }
  if (work !== src) { try { fs.unlinkSync(work); } catch (e) {} }
}
for (const a of SPEC.models) {
  if (only.length ? !only.includes(a.id) : (a.skip || (fs.existsSync(path.join(OUT, a.id + '.glb')) && !process.env.FORCE))) continue;
  try { await one(a); } catch (e) { console.log('FAIL', a.id, e.message.split('\n')[0]); REP[a.id] = { fail: e.message.split('\n')[0] }; fs.writeFileSync(REPF, JSON.stringify(REP, null, 1)); }
}
