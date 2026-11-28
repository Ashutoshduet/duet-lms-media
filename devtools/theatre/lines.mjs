// Lists every narration line of the "Kyun?" stories: node devtools/theatre/lines.mjs [repo] > jobs.json
// Each job: { lang: 'en' | 'hi', key, text, story }. The key is the djb2 hash the player uses (theatre/js/player.js vkey).
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const repo = path.resolve(process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..'));
export function vkey(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
export async function stories(root = repo) {
  const dir = path.join(root, 'theatre', 'stories'); const order = JSON.parse(fs.readFileSync(path.join(dir, 'order.json'), 'utf8'));
  const out = []; for (const id of order) out.push((await import(pathToFileURL(path.join(dir, id + '.js')).href)).default); return out;
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const jobs = []; const seen = new Set();
  for (const s of await stories()) for (const b of s.beats) for (const lang of ['en', 'hi']) {
    const text = b.say && b.say[lang]; if (!text) continue; const key = vkey(text); if (seen.has(lang + key)) continue; seen.add(lang + key);
    jobs.push({ lang, key, text, story: s.id });
  }
  process.stdout.write(JSON.stringify(jobs, null, 1));
}
