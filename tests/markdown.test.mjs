import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdown, parseInline, collectCode, parseExpect, chapterTitle, blocksText } from '../src/ui/markdown.js';

test('Inline: Code, fett, kursiv, Verweis, maskiertes Zeichen', () => {
  const n = parseInline('a `b *c*` **d** *e* [f](#g) \\*h');
  assert.deepEqual(n.map((x) => x.t), ['text', 'code', 'text', 'strong', 'text', 'em', 'text', 'link', 'text']);
  assert.equal(n[1].text, 'b *c*');
  assert.equal(n[7].href, '#g');
  assert.equal(n[8].text, ' *h');
});

test('Blöcke: Überschrift, Absatz, Listen, Tabelle, Zitat, Code', () => {
  const md = `# Titel\n\nEin Absatz\nüber zwei Zeilen.\n\n- eins\n- zwei\n  weiter\n\n1. a\n2. b\n\n| X | Y |\n|---|---|\n| 1 | 2 |\n\n> Zitat\n\n\`\`\`asm nocheck\nLDA #1\n\`\`\`\n`;
  const b = parseMarkdown(md);
  assert.deepEqual(b.map((x) => x.type), ['heading', 'p', 'ul', 'ol', 'table', 'quote', 'code']);
  assert.equal(chapterTitle(b), 'Titel');
  assert.equal(b[2].items.length, 2);
  assert.equal(b[4].rows[0].length, 2);
  assert.deepEqual(b[6].info, ['nocheck']);
  assert.equal(b[6].code, 'LDA #1');
});

test('Behälter enthalten Blöcke; Code darin wird gefunden', () => {
  const md = `::: aufgabe Übung 1\nText\n\n:::\n\n::: loesung\n\`\`\`asm expect=A:38,$0200:01\nLDA #1\n\`\`\`\n:::\n`;
  const b = parseMarkdown(md);
  assert.equal(b.length, 2);
  assert.equal(b[0].kind, 'aufgabe');
  assert.equal(b[0].title, 'Übung 1');
  const code = collectCode(b);
  assert.equal(code.length, 1);
  assert.deepEqual(parseExpect(code[0].info), [{ target: 'A', value: 0x38 }, { target: 0x200, value: 1 }]);
  assert.ok(blocksText(b).includes('Übung 1'));
});

test('Kein Markup wird als HTML gedeutet (Text bleibt Text)', () => {
  const n = parseInline('<script>alert(1)</script>');
  assert.deepEqual(n, [{ t: 'text', text: '<script>alert(1)</script>' }]);
});
