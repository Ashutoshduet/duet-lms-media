// Saves the Robotics Lab's own models (made in code by robotics/js; read only, nothing there is changed) as small GLB
// files for DUET AR: ar/models/robo_<id>.glb. Builds each one in headless Chrome with the Robotics Lab's code
// (export_robo.html), exports it with three.js's GLTFExporter, then welds, joins, WebP textures (≤ 1024 px) and meshopt.
// Needs the static server on AR_BASE (default http://127.0.0.1:8817/). Usage: node devtools/ar/export_robo.mjs [id …]
import puppeteer from 'puppeteer-core';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
const req = createRequire('/root/tools/node_modules/');
const { NodeIO } = req('@gltf-transform/core');
const { ALL_EXTENSIONS } = req('@gltf-transform/extensions');
const { dedup, prune, weld, join, flatten, meshopt, textureCompress, resample, quantize } = req('@gltf-transform/functions');
const { MeshoptEncoder, MeshoptDecoder } = req('meshoptimizer');
const sharp = req('sharp');
const ROOT = new URL('../../', import.meta.url).pathname, BASE = process.env.AR_BASE || 'http://127.0.0.1:8817/';
const EXPORTER = '/root/tools/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ['uno', 'hcsr04', 'irsensor', 'servo', 'dcmotor', 'l298n', 'arm', 'car', 'linecar', 'dht11', 'pir'];

await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const b = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, protocolTimeout: 600000,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
const pg = await b.newPage();
const errs = []; pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await pg.setRequestInterception(true);
pg.on('request', (r) => { if (r.url().endsWith('/__x/GLTFExporter.js')) r.respond({ status: 200, contentType: 'text/javascript', body: readFileSync(EXPORTER, 'utf8') }); else r.continue(); });
await pg.goto(BASE + 'devtools/ar/export_robo.html', { waitUntil: 'load' });
await pg.waitForFunction(() => window.READY === true || window.onerror, { timeout: 60000 }).catch(() => {});
if (errs.length) { console.log('page errors:', errs); }
for (const id of IDS) {
  const r = await pg.evaluate((i) => window.EXPORT(i), id);
  const raw = Buffer.from(r.b64, 'base64');
  const doc = await io.readBinary(new Uint8Array(raw));
  await doc.transform(dedup(), flatten(), join({ keepNamed: false }), weld(), resample(), prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 88 }), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  const out = ROOT + 'ar/models/robo_' + id + '.glb';
  writeFileSync(out, await io.writeBinary(doc));
  const prims = doc.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives().length, 0);
  console.log(id.padEnd(9), Math.round(r.tris) + ' tris', prims + ' draw calls', (raw.length / 1024).toFixed(0) + ' KB raw →', (statSync(out).size / 1024).toFixed(0) + ' KB');
}
if (errs.length) console.log('page errors:', errs);
await b.close();
