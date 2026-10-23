// Syntaxhervorhebung für 6502-Quelltext, ohne Bibliothek. Reine Funktionen (auch in Node prüfbar).
import { MNEMONICS } from '../core/opcodes.js';

const DIRECTIVES = new Set(['DCB', 'DCW', 'DEFINE', 'TEXT', 'DB', 'DW']);

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TOKEN = /\s+|"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)'?|\$[0-9a-fA-F]*|%[01]*|\d+|\.?[A-Za-z_][A-Za-z0-9_]*:?|[#(),*=<>+\-/&|^]|[^]/y;

// Teilt eine Zeile in Code und Kommentar (Strichpunkt außerhalb von Zeichenketten)
function splitComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '\\') i++;
      else if (ch === q) q = null;
    } else if (ch === '"' || ch === "'") q = ch;
    else if (ch === ';') return [line.slice(0, i), line.slice(i)];
  }
  return [line, ''];
}

function tokenize(code) {
  const tokens = [];
  TOKEN.lastIndex = 0;
  while (TOKEN.lastIndex < code.length) {
    const m = TOKEN.exec(code);
    tokens.push({ text: m[0], cls: null });
  }
  return tokens;
}

function classify(tokens) {
  let word = 0; // Anzahl der Wörter vor dem aktuellen (ohne Markendefinition)
  let prevSig = null;
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    const s = tk.text;
    if (/^\s+$/.test(s)) continue;
    const upper = s.toUpperCase();
    if (s[0] === '"' || s[0] === "'") tk.cls = 'str';
    else if (s[0] === '$' || s[0] === '%' || /^\d/.test(s)) tk.cls = 'num';
    else if (/^\.?[A-Za-z_]/.test(s)) {
      if (s.endsWith(':')) tk.cls = 'lbl';
      else if (word === 0 && MNEMONICS.has(upper)) { tk.cls = 'kw'; word = 1; }
      else if (word === 0 && (s[0] === '.' || DIRECTIVES.has(upper))) { tk.cls = 'dir'; word = 1; }
      else if (word === 0 && nextSig(tokens, i)?.text === '=') { tk.cls = 'lbl'; word = 1; }
      else if ((upper === 'X' || upper === 'Y') && prevSig?.text === ',') tk.cls = 'reg';
      else if (upper === 'A' && prevSig && prevSig.cls === 'kw' && !nextSig(tokens, i)) tk.cls = 'reg';
      else tk.cls = 'sym';
    } else if (s === '*' && word === 0 && nextSig(tokens, i)?.text === '=') { tk.cls = 'dir'; word = 1; }
    else tk.cls = 'op';
    prevSig = tk;
  }
}

function nextSig(tokens, i) {
  for (let j = i + 1; j < tokens.length; j++) if (!/^\s+$/.test(tokens[j].text)) return tokens[j];
  return null;
}

// HTML einer Zeile; jede Klasse hat das Präfix „t-“
export function highlightLine(line) {
  const [code, comment] = splitComment(line);
  const tokens = tokenize(code);
  classify(tokens);
  let html = '';
  for (const tk of tokens) {
    const e = escapeHtml(tk.text);
    html += tk.cls ? `<span class="t-${tk.cls}">${e}</span>` : e;
  }
  if (comment) html += `<span class="t-com">${escapeHtml(comment)}</span>`;
  return html;
}

export function highlight(source) {
  return source.split(/\r\n|\r|\n/).map(highlightLine);
}
