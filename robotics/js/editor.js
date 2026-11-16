// DUET Robotics Lab 360: the code editor. A plain textarea (it works with every keyboard, on phones and with a
// panel's on-screen keyboard) over a coloured copy of the same text, with line numbers. Marks: the line with an
// error (red, with the message under it) and the line the board is running now (yellow).
import { highlight } from './cpp.js';

const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export class Editor {
  constructor(host, onChange) {
    this.host = host; this.onChange = onChange || (() => {});
    host.classList.add('ed');
    host.innerHTML = '<div class="ed-g" aria-hidden="true"></div><div class="ed-w"><pre class="ed-h" aria-hidden="true"></pre><textarea class="ed-t" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="Arduino code"></textarea></div>';
    this.g = host.querySelector('.ed-g'); this.h = host.querySelector('.ed-h'); this.t = host.querySelector('.ed-t'); this.w = host.querySelector('.ed-w');
    this.err = null; this.run = 0; this.marks = [];
    this.t.addEventListener('input', () => { this.err = null; this.paint(); this.onChange(this.t.value); });
    this.t.addEventListener('scroll', () => this.sync());
    this.t.addEventListener('keydown', (e) => this.key(e));
  }
  get value() { return this.t.value; }
  set value(v) { this.t.value = v; this.err = null; this.paint(); }
  key(e) {
    const t = this.t;
    if (e.key === 'Tab') { e.preventDefault(); this.insert('  '); return; }
    if (e.key === 'Enter') { // keep the indent, one more after {
      e.preventDefault(); const s = t.selectionStart, before = t.value.slice(0, s); const line = before.slice(before.lastIndexOf('\n') + 1);
      let ind = (line.match(/^\s*/) || [''])[0]; if (/\{\s*$/.test(line)) ind += '  ';
      this.insert('\n' + ind); return;
    }
    if (e.key === '}' ) { const s = t.selectionStart, before = t.value.slice(0, s); const line = before.slice(before.lastIndexOf('\n') + 1); if (/^\s+$/.test(line) && line.length >= 2) { t.setRangeText('', s - 2, s, 'end'); } }
  }
  insert(txt) { const t = this.t; t.setRangeText(txt, t.selectionStart, t.selectionEnd, 'end'); this.err = null; this.paint(); this.onChange(t.value); }
  // mark: error { line, text } | running line | lines to point at (lesson)
  setError(e) { this.err = e; this.paint(); if (e) this.reveal(e.line); }
  setRun(line) { if (line === this.run) return; this.run = line; this.paintMarks(); }
  setMarks(lines) { this.marks = lines || []; this.paintMarks(); if (this.marks.length) this.reveal(this.marks[0]); }
  reveal(line) { const lh = this.lineH(); const top = (line - 1) * lh; const t = this.t; if (top < t.scrollTop || top > t.scrollTop + t.clientHeight - lh * 2) t.scrollTop = Math.max(0, top - t.clientHeight / 3); this.sync(); }
  lineH() { return parseFloat(getComputedStyle(this.t).lineHeight) || 20; }
  paint() {
    const lines = this.t.value.split('\n');
    let html = '';
    const toks = highlight(this.t.value); // across lines (block comments)
    for (const [k, txt] of toks) html += k ? `<span class="k-${k}">${esc(txt)}</span>` : esc(txt);
    this.h.innerHTML = html + '\n';
    this.g.innerHTML = lines.map((_, i) => `<div data-l="${i + 1}">${i + 1}</div>`).join('');
    this.paintMarks(); this.sync();
  }
  paintMarks() {
    for (const d of this.g.children) { const l = +d.dataset.l; d.className = (this.err && this.err.line === l ? 'e' : '') + (this.run === l ? ' r' : '') + (this.marks.includes(l) ? ' m' : ''); }
    let bars = this.w.querySelector('.ed-bars'); if (!bars) { bars = document.createElement('div'); bars.className = 'ed-bars'; this.w.insertBefore(bars, this.h); }
    const lh = this.lineH(), pad = parseFloat(getComputedStyle(this.t).paddingTop) || 0;
    let html = '';
    for (const l of this.marks) html += `<i class="m" style="top:${pad + (l - 1) * lh}px;height:${lh}px"></i>`;
    if (this.run) html += `<i class="r" style="top:${pad + (this.run - 1) * lh}px;height:${lh}px"></i>`;
    if (this.err) html += `<i class="e" style="top:${pad + (this.err.line - 1) * lh}px;height:${lh}px"></i>`;
    bars.innerHTML = html; this.sync();
  }
  sync() {
    const t = this.t; this.h.style.transform = `translate(${-t.scrollLeft}px,${-t.scrollTop}px)`;
    const b = this.w.querySelector('.ed-bars'); if (b) b.style.transform = `translateY(${-t.scrollTop}px)`;
    this.g.style.transform = `translateY(${-t.scrollTop}px)`;
  }
}
