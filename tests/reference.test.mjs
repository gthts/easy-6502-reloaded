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

// Beispiele der Referenz: jedes Programm übersetzt, läuft bis BRK und liefert die angegebenen Werte
import { Machine } from '../src/core/machine.js';
import { parseExpect } from '../src/ui/markdown.js';

for (const loc of locales) {
  test(`Referenz ${loc}: jedes Befehlsbeispiel läuft und liefert die angegebenen Werte`, () => {
    const data = JSON.parse(fs.readFileSync(path.join(root, 'content', loc, 'reference.json'), 'utf8'));
    const problems = [];
    for (const mn of MNEMONICS) {
      const ex = data.instructions[mn]?.example;
      if (!ex) { problems.push(`${mn}: Beispiel fehlt`); continue; }
      if (!new RegExp('\\b' + mn + '\\b', 'i').test(ex.code)) problems.push(`${mn}: Beispiel enthält den Befehl nicht`);
      const m = new Machine();
      const r = m.assembleAndLoad(ex.code);
      if (!r.ok) { problems.push(`${mn}: ${r.errors.map((e) => `Z${e.line} ${e.key}`).join(', ')}`); continue; }
      m.run(10000);
      if (m.stopReason !== 'brk') problems.push(`${mn}: endet nicht mit BRK (${m.stopReason})`);
      for (const e of parseExpect([`expect=${ex.expect}`])) {
        const actual = typeof e.target === 'number' ? m.mem.peek(e.target)
          : e.target === 'A' ? m.cpu.a : e.target === 'X' ? m.cpu.x : e.target === 'Y' ? m.cpu.y
            : e.target === 'SP' ? m.cpu.sp : m.cpu[e.target.toLowerCase()];
        if (actual !== e.value) problems.push(`${mn}: ${e.target} ist ${actual}, erwartet ${e.value}`);
      }
    }
    assert.deepEqual(problems, []);
  });
}
