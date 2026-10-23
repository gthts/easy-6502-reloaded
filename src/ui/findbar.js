// Suchen und Ersetzen im Quelltext. Treffer werden unter dem Text markiert (Ebene des Editors), der aktuelle Treffer ist
// zusätzlich im Textfeld ausgewählt. Ersetzen geht über die Eingabe des Browsers und lässt sich mit Strg+Z zurücknehmen.
import { t } from '../i18n/index.js';

export function createFindBar({ editor, textarea, ui }) {
  let matches = [];
  let cur = -1;

  const caseSensitive = () => ui.caseBox.checked;

  function compute() {
    const q = ui.query.value;
    matches = [];
    if (q === '') return;
    const hay = caseSensitive() ? textarea.value : textarea.value.toLowerCase();
    const needle = caseSensitive() ? q : q.toLowerCase();
    for (let p = hay.indexOf(needle); p >= 0; p = hay.indexOf(needle, p + needle.length)) matches.push({ start: p, end: p + needle.length });
  }

  function announce(text) {
    ui.count.textContent = text;
  }

  function show() {
    editor.setMatches(matches, cur);
    if (ui.query.value === '') announce('');
    else if (!matches.length) announce(t('find.none'));
    else announce(cur >= 0 ? t('find.count', { current: cur + 1, total: matches.length }) : t('find.total', { total: matches.length }));
  }

  // Index des Treffers, der der Auswahl entspricht (sonst -1)
  function indexOfSelection() {
    return matches.findIndex((m) => m.start === textarea.selectionStart && m.end === textarea.selectionEnd);
  }

  function select(i) {
    cur = i;
    const m = matches[i];
    textarea.setSelectionRange(m.start, m.end);
    const line = textarea.value.slice(0, m.start).split('\n').length;
    editor.reveal(line);
    show();
  }

  function step(dir) {
    compute();
    if (!matches.length) { cur = -1; show(); return; }
    const from = dir > 0 ? textarea.selectionEnd : textarea.selectionStart;
    let i;
    if (dir > 0) {
      i = matches.findIndex((m) => m.start >= (indexOfSelection() >= 0 ? textarea.selectionEnd : from));
      if (i < 0) i = 0;
    } else {
      i = -1;
      for (let k = matches.length - 1; k >= 0; k--) if (matches[k].start < from) { i = k; break; }
      if (i < 0) i = matches.length - 1;
    }
    select(i);
  }

  function replaceCurrent() {
    compute();
    let i = indexOfSelection();
    if (i < 0) { step(1); i = indexOfSelection(); if (i < 0) return; }
    textarea.focus();
    if (!document.execCommand('insertText', false, ui.replacement.value)) {
      textarea.setRangeText(ui.replacement.value, matches[i].start, matches[i].end, 'end');
      textarea.dispatchEvent(new Event('input'));
    }
    ui.replacement.focus();
    step(1);
  }

  function replaceAll() {
    compute();
    if (!matches.length) { show(); return; }
    const n = matches.length;
    const text = textarea.value;
    let out = '';
    let last = 0;
    for (const m of matches) { out += text.slice(last, m.start) + ui.replacement.value; last = m.end; }
    out += text.slice(last);
    const top = textarea.scrollTop;
    editor.replaceAll(out);
    textarea.scrollTop = top;
    textarea.dispatchEvent(new Event('scroll'));
    compute();
    cur = -1;
    show();
    announce(t('find.replaced', { n }));
  }

  function open(withReplace) {
    ui.bar.hidden = false;
    const sel = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    if (sel && !sel.includes('\n')) ui.query.value = sel;
    compute();
    cur = indexOfSelection();
    show();
    (withReplace ? ui.replacement : ui.query).focus();
    (withReplace ? ui.replacement : ui.query).select();
  }

  function close() {
    ui.bar.hidden = true;
    matches = [];
    cur = -1;
    editor.setMatches([], -1);
    textarea.focus();
  }

  ui.query.addEventListener('input', () => { compute(); cur = -1; show(); if (matches.length) step(1); });
  ui.caseBox.addEventListener('change', () => { compute(); cur = -1; show(); });
  ui.next.addEventListener('click', () => step(1));
  ui.prev.addEventListener('click', () => step(-1));
  ui.replaceBtn.addEventListener('click', replaceCurrent);
  ui.replaceAllBtn.addEventListener('click', replaceAll);
  ui.closeBtn.addEventListener('click', close);

  ui.bar.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Enter' && e.target === ui.query) { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
    else if (e.key === 'Enter' && e.target === ui.replacement) { e.preventDefault(); replaceCurrent(); }
    else if (e.key === 'F3') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
  });

  // Tastenkürzel im Editor
  textarea.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.altKey && e.key.toLowerCase() === 'f') { e.preventDefault(); open(false); }
    else if (mod && !e.altKey && e.key.toLowerCase() === 'h') { e.preventDefault(); open(true); }
    else if (e.key === 'F3' && !ui.bar.hidden) { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
  });

  // Der Text hat sich geändert: Treffer neu berechnen
  editor.onTextChange(() => {
    if (ui.bar.hidden) return;
    compute();
    cur = indexOfSelection();
    show();
  });

  return { open, close };
}
