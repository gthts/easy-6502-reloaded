// Kleiner Markdown-Umsetzer für das Lehrbuch (ohne Bibliothek). Ergebnis ist ein Baum, kein HTML-Text:
// die Oberfläche baut daraus DOM-Elemente (kein innerHTML, daher keine Einschleusung von Markup).
//
// Unterstützt:
//   # bis ###### Überschriften · Absätze · - / * Listen · 1. Listen · > Zitate · | Tabellen |
//   ```asm [nocheck] [expect=A:38,$0200:01] ... ``` Codeblöcke (Infozeile: Sprache und Merkmale)
//   ::: hinweis|merke|aufgabe|loesung [Titel] ... :::   (Behälter, nicht verschachtelt)
//   Inline: `code`, **fett**, *kursiv*, [Text](#kapitel-id), [Text](https://…)

// ---- Inline ----------------------------------------------------------------------

export function parseInline(text) {
  const out = [];
  let buf = '';
  const flush = () => { if (buf) { out.push({ t: 'text', text: buf }); buf = ''; } };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) { buf += text[i + 1]; i += 2; continue; }
    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) { flush(); out.push({ t: 'code', text: text.slice(i + 1, end) }); i = end + 1; continue; }
    }
    if (ch === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end > i + 1) { flush(); out.push({ t: 'strong', children: parseInline(text.slice(i + 2, end)) }); i = end + 2; continue; }
    }
    if (ch === '*') {
      const end = text.indexOf('*', i + 1);
      if (end > i + 1 && text[i + 1] !== ' ') { flush(); out.push({ t: 'em', children: parseInline(text.slice(i + 1, end)) }); i = end + 1; continue; }
    }
    if (ch === '[') {
      const m = /^\[([^\]]+)\]\(([^)\s]+)\)/.exec(text.slice(i));
      if (m) { flush(); out.push({ t: 'link', href: m[2], children: parseInline(m[1]) }); i += m[0].length; continue; }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

// ---- Blöcke ----------------------------------------------------------------------

const CONTAINERS = new Set(['hinweis', 'merke', 'aufgabe', 'loesung']);

export function parseMarkdown(src) {
  const lines = src.replace(/\r\n?/g, '\n').split('\n');
  let i = 0;

  function parseBlocks(stopAtContainerEnd) {
    const blocks = [];
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '') { i++; continue; }

      if (stopAtContainerEnd && /^:::\s*$/.test(line)) { i++; return blocks; }

      let m;
      if ((m = /^```\s*(\S*)\s*(.*)$/.exec(line))) {
        const lang = m[1];
        const info = m[2].trim() ? m[2].trim().split(/\s+/) : [];
        const code = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
        i++;
        blocks.push({ type: 'code', lang, info, code: code.join('\n') });
        continue;
      }
      if ((m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line))) {
        blocks.push({ type: 'heading', level: m[1].length, children: parseInline(m[2]), text: m[2] });
        i++;
        continue;
      }
      if (!stopAtContainerEnd && (m = /^:::\s*(\w+)\s*(.*)$/.exec(line)) && CONTAINERS.has(m[1])) {
        i++;
        const children = parseBlocks(true);
        blocks.push({ type: 'container', kind: m[1], title: m[2].trim(), children });
        continue;
      }
      if (/^>\s?/.test(line)) {
        const q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
        blocks.push({ type: 'quote', children: parseMarkdown(q.join('\n')) });
        continue;
      }
      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
        const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
        const head = cells(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]));
        blocks.push({ type: 'table', head: head.map(parseInline), rows: rows.map((r) => r.map(parseInline)) });
        continue;
      }
      if ((m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line))) {
        const ordered = /\d/.test(m[2]);
        const items = [];
        while (i < lines.length) {
          const mm = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
          if (mm && /\d/.test(mm[2]) === ordered) {
            let text = mm[3];
            i++;
            // Fortsetzungszeilen (eingerückt, nicht leer, kein neuer Eintrag)
            while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i])) text += ' ' + lines[i++].trim();
            items.push(parseInline(text));
          } else break;
        }
        blocks.push({ type: ordered ? 'ol' : 'ul', items });
        continue;
      }
      // Absatz: bis zur nächsten Leerzeile oder einem anderen Blockanfang
      const p = [];
      while (
        i < lines.length && lines[i].trim() !== '' && !/^```/.test(lines[i]) && !/^#{1,6}\s/.test(lines[i]) &&
        !/^>\s?/.test(lines[i]) && !/^:::/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i]) &&
        !(/^\s*\|.*\|\s*$/.test(lines[i]) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1]))
      ) p.push(lines[i++].trim());
      if (p.length === 0) { i++; continue; }
      blocks.push({ type: 'p', children: parseInline(p.join(' ')) });
    }
    return blocks;
  }

  return parseBlocks(false);
}

// ---- Hilfen für Prüfung und Darstellung -------------------------------------------------

// Erste Überschrift der Ebene 1 als Kapiteltitel
export function chapterTitle(blocks) {
  const h = blocks.find((b) => b.type === 'heading' && b.level === 1);
  return h ? h.text : '';
}

// Alle Codeblöcke (auch in Behältern), in Reihenfolge
export function collectCode(blocks, out = []) {
  for (const b of blocks) {
    if (b.type === 'code') out.push(b);
    else if (b.children && Array.isArray(b.children) && b.children.length && typeof b.children[0] === 'object' && 'type' in b.children[0] && b.type !== 'p' && b.type !== 'heading') collectCode(b.children, out);
  }
  return out;
}

// „A:38,$0200:01,Z:1“ → [{ target: 'A', value: 0x38 }, { target: 0x200, value: 1 }, …]
export function parseExpect(info) {
  const tok = info.find((x) => x.startsWith('expect='));
  if (!tok) return null;
  return tok.slice(7).split(',').filter(Boolean).map((pair) => {
    const [target, value] = pair.split(':');
    const t = /^\$[0-9a-fA-F]+$/.test(target) ? parseInt(target.slice(1), 16) : target.toUpperCase();
    return { target: t, value: parseInt(value.replace(/^\$/, ''), 16) };
  });
}

// Reiner Text eines Inline-Baums (für Suche und Titel)
export function inlineText(nodes) {
  return nodes.map((n) => (n.t === 'text' || n.t === 'code' ? n.text : inlineText(n.children ?? []))).join('');
}

export function blocksText(blocks) {
  let s = '';
  for (const b of blocks) {
    if (b.type === 'code') s += `${b.code}\n`;
    else if (b.type === 'p' || b.type === 'heading') s += `${inlineText(b.children)}\n`;
    else if (b.type === 'ul' || b.type === 'ol') s += b.items.map(inlineText).join('\n') + '\n';
    else if (b.type === 'table') s += [b.head, ...b.rows].map((r) => r.map(inlineText).join(' ')).join('\n') + '\n';
    else if (b.children) s += blocksText(b.children) + (b.title ? ` ${b.title}\n` : '');
  }
  return s;
}
