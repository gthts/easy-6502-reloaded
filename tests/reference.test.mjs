import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MNEMONICS, BY_MNEMONIC, OPCODES } from '../src/core/opcodes.js';
import { META, MODE_INFO, MODE_ORDER, CATEGORIES, chapterFor, flagEffects } from '../src/reference/data.js';
import { parseMarkdown, inlineText } from '../src/ui/markdown.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const locales = fs.readdirSync(path.join(root, 'content')).filter((d) => fs.existsSync(path.join(root, 'content', d, 'reference.json')));

test('Jeder Befehl hat Metadaten; Gruppen und Flags sind gültig', () => {
  for (const mn of MNEMONICS) {
    assert.ok(META[mn], `Metadaten fehlen: ${mn}`);
    assert.ok(CATEGORIES.includes(META[mn].cat), `Gruppe: ${mn}`);
    for (const { flag } of flagEffects(META[mn].flags)) assert.ok('NVBDIZC'.includes(flag), `Flag ${flag} bei ${mn}`);
  }
  for (const mn of Object.keys(META)) assert.ok(MNEMONICS.has(mn), `unbekannter Befehl in den Metadaten: ${mn}`);
  for (const modes of Object.values(BY_MNEMONIC)) for (const m of Object.keys(modes)) assert.ok(MODE_ORDER.includes(m) && MODE_INFO[m]);
});

for (const loc of locales) {
  test(`Referenz ${loc}: alle Befehle, Adressierungsarten und Gruppen sind beschrieben`, () => {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'content', loc, 'reference.json'), 'utf8'));
    for (const mn of MNEMONICS) {
      assert.ok(data.instructions[mn]?.name && data.instructions[mn]?.text, `Text fehlt: ${mn}`);
    }
    for (const m of MODE_ORDER) assert.ok(data.modes[m]?.name && data.modes[m]?.text, `Adressierungsart: ${m}`);
    for (const c of CATEGORIES) assert.ok(data.categories[c], `Gruppe: ${c}`);
    assert.equal(Object.keys(data.instructions).length, MNEMONICS.size);
  });

  test(`Referenz ${loc}: Übersicht lässt sich lesen, Tabelle mit maskiertem Strich bleibt heil`, () => {
    const blocks = parseMarkdown(fs.readFileSync(path.join(root, 'content', loc, 'reference.md'), 'utf8'));
    assert.ok(blocks.some((b) => b.type === 'table'));
    const row = blocks.filter((b) => b.type === 'table').flatMap((b) => b.rows).find((r) => inlineText(r[1] ?? []).includes('|'));
    assert.ok(row, 'Zeile mit maskiertem Strich gefunden');
    assert.equal(row.length, 3, 'die Zeile hat drei Spalten');
  });
}

test('Lehrbuchkapitel, auf die die Referenz verweist, gibt es', () => {
  const ids = new Set(JSON.parse(fs.readFileSync(path.join(root, 'content', 'de', 'index.json'), 'utf8')).chapters.map((f) => f.replace(/^\d+-/, '').replace(/\.md$/, '')));
  for (const mn of MNEMONICS) assert.ok(ids.has(chapterFor(mn)), `${mn} → ${chapterFor(mn)}`);
  for (const m of MODE_ORDER) assert.ok(ids.has(MODE_INFO[m].chapter), `${m} → ${MODE_INFO[m].chapter}`);
});

test('Opcode-Tabelle: 151 Einträge, jede Adressierungsart je Befehl einmalig', () => {
  assert.equal(OPCODES.filter(Boolean).length, 151);
  for (const [mn, modes] of Object.entries(BY_MNEMONIC)) {
    const ops = Object.values(modes);
    assert.equal(new Set(ops).size, ops.length, mn);
  }
});
