// DUET STEM online tutor: a Cloudflare Worker that answers students' questions with Claude.
// The apps send { q, lang, app, here, ctx[], history[] } and get { answer }. The API key stays here, never in the apps.
// Deploy: create a Worker, paste this file, add the secret ANTHROPIC_API_KEY, then put the Worker's URL in
// tutor.json at the site root ({ "url": "https://….workers.dev" }) so every app finds it.
const MODEL = 'claude-haiku-5-5';
const ORIGINS = ['https://ashutoshduet.github.io', 'http://localhost:8790'];
const LANG = { en: 'simple English', hi: 'simple Hindi in Devanagari script', hg: 'Hinglish (Hindi written in the Latin alphabet, with common English science words)' };
const APP = { science: 'Science Lab 360 (chemistry, physics and biology activities, NCERT Class 6–10)', maths: 'Maths Lab 360 (NCERT maths, Class 3–10)', body: 'Human Body 360 (human anatomy and how organs work)' };
const cors = (o) => ({ 'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0], 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Vary': 'Origin' });
export default {
  async fetch(req, env) {
    const o = req.headers.get('Origin') || '';
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(o) });
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: cors(o) });
    let b; try { b = await req.json(); } catch (e) { return new Response('bad json', { status: 400, headers: cors(o) }); }
    const q = String(b.q || '').slice(0, 400); if (!q) return new Response('no question', { status: 400, headers: cors(o) });
    const lang = LANG[b.lang] ? b.lang : 'en';
    const ctx = (Array.isArray(b.ctx) ? b.ctx : []).slice(0, 4).map((c) => String(c).slice(0, 700)).join('\n');
    const system = `You are the DUET STEM tutor inside ${APP[b.app] || 'a school science app'}, talking to a school student in India (about 10 to 16 years old).
Answer in ${LANG[lang]}, in 2 to 5 short sentences (at most 90 words), warmly and exactly, at the level of an NCERT textbook.
${b.here ? `The student is now doing: ${String(b.here).slice(0, 120)}.` : ''}
Use these passages from the app when they answer the question; do not contradict them:
${ctx || '(none)'}
If the question is not about school subjects, gently bring the student back to the activity. Never ask for personal details. Never give unsafe instructions (fire, chemicals, electricity at home): say to do it only with a teacher.`;
    const msgs = []; for (const h of (Array.isArray(b.history) ? b.history : []).slice(-4)) msgs.push({ role: h.me ? 'user' : 'assistant', content: String(h.text || '').slice(0, 600) || '…' });
    while (msgs.length && msgs[0].role !== 'user') msgs.shift(); msgs.push({ role: 'user', content: q });
    for (let i = msgs.length - 2; i >= 0; i--) if (msgs[i].role === msgs[i + 1].role) msgs.splice(i, 1);
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, system, messages: msgs }) });
    if (!r.ok) return new Response(JSON.stringify({ error: r.status }), { status: 502, headers: { ...cors(o), 'content-type': 'application/json' } });
    const j = await r.json(); const answer = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
    return new Response(JSON.stringify({ answer }), { headers: { ...cors(o), 'content-type': 'application/json' } });
  },
};
