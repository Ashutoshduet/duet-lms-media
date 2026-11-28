// Which app this page is: Science Lab 360 (science/index.html) or one of the one-subject apps made from the same code:
// DUET Maths Lab 360, Physics Lab 360, Chemistry Lab 360 and Biology Lab 360 (<subject>/index.html sets
// window.DUET_APP = '<subject>'). In Node (narration and tests) it is always Science Lab.
export const APP = (typeof window !== 'undefined' && window.DUET_APP) || 'science';
export const MATHS = APP === 'maths';
export const ONLY = ['maths', 'physics', 'chemistry', 'biology'].includes(APP) ? APP : null; // the one subject this app shows
