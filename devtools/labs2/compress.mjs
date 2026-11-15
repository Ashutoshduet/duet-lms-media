// raw lab GLB -> meshopt-compressed GLB for the app (names kept: one mesh per part)
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { meshopt, prune, quantize } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder });
for (const lab of process.argv.slice(2)) {
  const doc = await io.read(`/root/work/build3/labs/${lab}_raw.glb`);
  await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
  await io.write(`/home/claude/duet-lms-media/body/models/labs/${lab}.glb`, doc);
  console.log(lab, (await import('fs')).statSync(`/home/claude/duet-lms-media/body/models/labs/${lab}.glb`).size);
}
