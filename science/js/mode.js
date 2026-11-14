// Which app this page is: Science Lab 360 (science/index.html) or DUET Maths Lab 360 (maths/index.html sets
// window.DUET_APP = 'maths' and reuses this code). In Node (narration and tests) it is always Science Lab.
export const MATHS = typeof window !== 'undefined' && window.DUET_APP === 'maths';
