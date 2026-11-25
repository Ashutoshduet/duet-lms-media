// In a headset (Meta Quest and other standalone headsets) the lab starts at Class 6. Headsets are for users aged 10 and over
// (Meta Horizon Store: no app there may be directed at children under 10), so in a headset the class list shows Classes 6
// to 12 and the lessons made only for Classes 1 to 5 (the battery circuits for the youngest, the early micro:bit projects,
// the project bank's Class 1-5 jobs) stay on phones, tablets, smart panels and computers. A lesson that a Class 6-12
// session uses, or that has no class, stays. Imported by main.js before the page is built.
import { LESSONS } from './lessons.js';
import { CURRICULUM } from './curriculum.js';

export const HEADSET = typeof navigator !== 'undefined' && /OculusBrowser|Quest|Pico|Vive|Wolvic/i.test(navigator.userAgent || '');
export const MIN_CLASS = HEADSET ? 6 : 1;

if (MIN_CLASS > 1) {
  const keep = new Set(Object.entries(CURRICULUM).filter(([k]) => +k >= MIN_CLASS).flatMap(([, list]) => list.map((x) => x.id)));
  const young = (c) => { const m = /(\d+)(?:\s*[–-]\s*(\d+))?/.exec(String(c || '')); return !!m && +(m[2] || m[1]) < MIN_CLASS; };
  for (let i = LESSONS.length - 1; i >= 0; i--) if (young(LESSONS[i].cls) && !keep.has(LESSONS[i].id)) LESSONS.splice(i, 1);
  for (const k of Object.keys(CURRICULUM)) if (+k < MIN_CLASS) delete CURRICULUM[k];
}
