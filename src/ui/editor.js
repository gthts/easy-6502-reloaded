// Quelltexteditor ohne Bibliothek: ein Textfeld mit durchsichtigem Text über einer eingefärbten Ebene,
// daneben eine Leiste mit Zeilennummern, Fehler- und Haltepunktmarken.
import { highlight } from './highlight.js';

const INDENT = '  ';

import { MNEMONICS } from '../core/opcodes.js';

export function createEditor({ textarea, layer, gutter, onChange, onGutterClick, onHelp }) {
  const layerIn = layer.firstElementChild; // <code>
  const gutterIn = gutter.firstElementChild;
  let lineEls = [];
  let gutEls = [];
  let errors = new Map(); // Zeile -> Meldung
  let breakpoints = new Set();
  let active = 0;

  // ---- Darstellung --------------------------------------------------------------

  function render() {
    const lines = highlight(textarea.value);
    const n = lines.length;
    layerIn.innerHTML = lines.map((h) => `<div class="l">${h}</div>`).join('');
    lineEls = [...layerIn.children];
    if (gutEls.length !== n) {
      gutterIn.replaceChildren();
      gutEls = [];
      const frag = document.createDocumentFragment();
      for (let i = 1; i <= n; i++) {
        const g = document.createElement('div');
        g.className = 'g';
        g.dataset.line = String(i);
        const mark = document.createElement('span');
        mark.className = 'mk';
        const num = document.createElement('span');
        num.className = 'n';
        num.textContent = String(i);
        g.append(mark, num);
        gutEls.push(g);
        frag.append(g);
      }
      gutterIn.append(frag);
      gutter.style.setProperty('--digits', String(Math.max(3, String(n).length)));
    }
    applyMarkers();
  }

  function applyMarkers() {
    for (let i = 0; i < lineEls.length; i++) {
      const line = i + 1;
      const err = errors.has(line);
      const act = line === active;
      lineEls[i].classList.toggle('err', err);
      lineEls[i].classList.toggle('act', act);
      const g = gutEls[i];
      g.classList.toggle('err', err);
      g.classList.toggle('act', act);
      g.classList.toggle('bp', breakpoints.has(line));
      if (err) g.title = errors.get(line);
      else g.removeAttribute('title');
      g.firstChild.textContent = breakpoints.has(line) ? '●' : err ? '!' : act ? '▸' : '';
    }
  }

  function syncScroll() {
    const x = textarea.scrollLeft;
    const y = textarea.scrollTop;
    layerIn.style.transform = `translate(${-x}px, ${-y}px)`;
    gutterIn.style.transform = `translateY(${-y}px)`;
  }

  textarea.addEventListener('scroll', syncScroll);
  textarea.addEventListener('input', () => {
    render();
    syncScroll();
    onChange?.();
  });
  gutter.addEventListener('click', (e) => {
    const g = e.target.closest('.g');
    if (g) onGutterClick?.(Number(g.dataset.line));
  });
  // Das Rad über der Leiste bewegt den Text
  gutter.addEventListener('wheel', (e) => {
    textarea.scrollTop += e.deltaY;
    e.preventDefault();
  }, { passive: false });

  // ---- Eingabe -----------------------------------------------------------------

  // Fügt Text an der Auswahl ein, so dass Rückgängig/Wiederholen funktioniert
  function insert(text) {
    textarea.focus();
    if (!document.execCommand('insertText', false, text)) {
      textarea.setRangeText(text, textarea.selectionStart, textarea.selectionEnd, 'end');
      textarea.dispatchEvent(new Event('input'));
    }
  }

  function lineBounds(pos) {
    const v = textarea.value;
    const start = v.lastIndexOf('\n', pos - 1) + 1;
    let end = v.indexOf('\n', pos);
    if (end === -1) end = v.length;
    return [start, end];
  }

  function reindent(outdent) {
    const v = textarea.value;
    const selStart = textarea.selectionStart;
    let selEnd = textarea.selectionEnd;
    if (selEnd > selStart && v[selEnd - 1] === '\n') selEnd--;
    const [from] = lineBounds(selStart);
    const [, to] = lineBounds(selEnd);
    const block = v.slice(from, to);
    const out = block
      .split('\n')
      .map((l) => (outdent ? l.replace(/^(?: {1,2}|\t)/, '') : INDENT + l))
      .join('\n');
    textarea.setSelectionRange(from, to);
    insert(out);
    textarea.setSelectionRange(from, from + out.length);
  }

  // F1: Befehl unter dem Cursor (sonst der erste Befehl der Zeile) in der Referenz öffnen
  function helpWord() {
    const v = textarea.value;
    const pos = textarea.selectionStart;
    const [ls, le] = lineBounds(pos);
    const line = v.slice(ls, le);
    const rel = pos - ls;
    for (const m of line.matchAll(/[A-Za-z]{3}/g)) {
      if (m.index <= rel && rel <= m.index + 3 && MNEMONICS.has(m[0].toUpperCase())) return m[0].toUpperCase();
    }
    for (const m of line.replace(/;.*/, '').matchAll(/\b[A-Za-z]{3}\b/g)) if (MNEMONICS.has(m[0].toUpperCase())) return m[0].toUpperCase();
    return null;
  }

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'F1' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      const w = helpWord();
      if (w && onHelp) { e.preventDefault(); onHelp(w); }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const multi = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd).includes('\n');
      if (e.shiftKey || multi) reindent(e.shiftKey);
      else insert(INDENT);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Einrückung der Zeile übernehmen
      const [start] = lineBounds(textarea.selectionStart);
      const indent = /^[ \t]*/.exec(textarea.value.slice(start, textarea.selectionStart))[0];
      if (indent) {
        e.preventDefault();
        insert('\n' + indent);
      }
    }
  });

  // ---- Schnittstelle ---------------------------------------------------------------

  const api = {
    getValue: () => textarea.value,
    // Ersetzt den Inhalt ohne Rückgängig-Verlauf (Start)
    setValue(text) {
      textarea.value = text;
      render();
      syncScroll();
    },
    // Ersetzt den Inhalt und lässt sich mit Strg+Z zurücknehmen
    replaceAll(text) {
      textarea.focus();
      textarea.select();
      insert(text);
      textarea.setSelectionRange(0, 0);
      textarea.scrollTop = 0;
      syncScroll();
    },
    focus: () => textarea.focus(),
    setErrors(map) {
      errors = map;
      applyMarkers();
    },
    setBreakpoints(set) {
      let same = set.size === breakpoints.size;
      if (same) for (const l of set) if (!breakpoints.has(l)) { same = false; break; }
      if (same) return;
      breakpoints = set;
      applyMarkers();
    },
    setActive(line) {
      if (line === active) return;
      active = line;
      applyMarkers();
    },
    // Zeile in den sichtbaren Bereich holen
    reveal(line) {
      if (!line) return;
      const h = lineEls[0]?.offsetHeight || 20;
      const top = (line - 1) * h;
      const view = textarea.clientHeight;
      if (top < textarea.scrollTop + h || top + 2 * h > textarea.scrollTop + view) {
        textarea.scrollTop = Math.max(0, top - view / 2);
      }
    },
    // Cursor an den Anfang einer Zeile setzen
    goto(line) {
      const lines = textarea.value.split('\n');
      let pos = 0;
      for (let i = 0; i < Math.min(line - 1, lines.length); i++) pos += lines[i].length + 1;
      textarea.focus();
      textarea.setSelectionRange(pos, pos);
      api.reveal(line);
    },
  };
  return api;
}
