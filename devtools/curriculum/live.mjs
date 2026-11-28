// Prints the lessons that are live in Robotics Lab 360 as JSON (used by ideabank.py and curriculum.py).
globalThis.document = { createElement: () => ({ getContext: () => null, style: {} }), documentElement: { lang: 'en' } };
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const url = new URL('../../robotics/js/lessons.js', import.meta.url);
const m = await import(url.href);
const out = m.LESSONS.map((l) => ({
  id: l.id, title: l.title.en, title_hi: l.title.hi, group: l.group, board: l.board || (l.view && /^mb/.test(l.view) ? 'microbit' : 'uno'),
  cls: l.cls ? parseInt(String(l.cls), 10) : null, lang: l.lang || 'cpp', batch: l.batch || null,
  parts: [...new Set([...(l.setup && l.setup.parts || []), ...l.steps.filter((s) => s.place).map((s) => s.place)].map((p) => p.type))],
}));
process.stdout.write(JSON.stringify(out));
