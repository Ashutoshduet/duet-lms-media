// DUET Little Learners: the list of every clip the app can play (devtools/early/voice_jobs.json), from early/js/data.js.
// Clips are named by the same text hash the other DUET apps use, so a changed sentence gets a new clip.
// usage: node devtools/early/voices.mjs && python3 devtools/early/gen_voice.py
import fs from 'fs';
const { allSpeech } = await import(new URL('../../early/js/data.js', import.meta.url));
export const vkey = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
const jobs = allSpeech().map(([lang, text]) => ({ lang, key: vkey(text), text }));
fs.writeFileSync(new URL('./voice_jobs.json', import.meta.url), JSON.stringify(jobs));
console.log(jobs.length, 'clips;', jobs.filter((j) => j.lang === 'hi').length, 'in Hindi');
