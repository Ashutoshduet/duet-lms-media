// Prints the lessons that are live in Robotics Lab 360 as JSON (used by ideabank.py and curriculum.py).
globalThis.document = { createElement: () => ({ getContext: () => null, style: {} }), documentElement: { lang: 'en' } };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const url = new URL('../../robotics/js/lessons.js', import.meta.url);
const m = await import(url.href);
// (preview: with FACTORY=1 the factory lessons are counted even before lessons.js registers them)
if (process.env.FACTORY && !m.LESSONS.some((l) => l.batch === 'F')) { const c = await import(new URL('../../robotics/js/circuits.js', import.meta.url).href); m.LESSONS.push(...c.batchC({ W: m.LESSON_WORDS }, m.LESSONS.length).map((l) => Object.assign(l, { group: 'circuits' }))); const f = await import(new URL('../../robotics/js/factory.js', import.meta.url).href); m.LESSONS.push(...f.batchF({ W: m.LESSON_WORDS }, m.LESSONS.length).map((l) => Object.assign(l, { group: 'bank' }))); }
// (batches 8–10, the Class 2–4 micro:bit projects, the same way)
if (process.env.FACTORY && !m.LESSONS.some((l) => l.batch === 8)) { const t3 = (en, hi, hg) => ({ en, hi, hg }); for (const [f, b, k] of [['lessons8.js', 'batch8', 8], ['lessons9.js', 'batch9', 9], ['lessons10.js', 'batch10', 10], ['lessons11.js', 'batch11', 11]]) { const x = await import(new URL('../../robotics/js/' + f, import.meta.url).href); m.LESSONS.push(...x[b]({ t3 }, m.LESSONS.length).map((l) => Object.assign(l, { group: 'microbit' }))); } }
const out = m.LESSONS.map((l) => ({
  id: l.id, title: l.title.en, title_hi: l.title.hi, group: l.group, board: l.board || (l.view && /^mb/.test(l.view) ? 'microbit' : l.batch === 'C' ? 'none' : 'uno'),
  cls: l.cls ? parseInt(String(l.cls), 10) : null, lang: l.lang || 'cpp', batch: l.batch || null, factory: l.factory || null,
  parts: [...new Set([...(l.setup && l.setup.parts || []), ...l.steps.filter((s) => s.place).map((s) => s.place)].map((p) => p.type))],
}));
process.stdout.write(JSON.stringify(out));
