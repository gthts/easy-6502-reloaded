// Prüft das Lehrbuch: Kapitel vorhanden, jeder Codeblock lässt sich übersetzen, angegebene Ergebnisse stimmen.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdown, collectCode, parseExpect, chapterTitle } from '../src/ui/markdown.js';
import { Machine } from '../src/core/machine.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = path.join(root, 'content');

const locales = fs.readdirSync(contentDir).filter((d) => fs.statSync(path.join(contentDir, d)).isDirectory());

function readIndex(loc) {
  return JSON.parse(fs.readFileSync(path.join(contentDir, loc, 'index.json'), 'utf8')).chapters;
}

function runBlock(code) {
  const m = new Machine();
  const r = m.assembleAndLoad(code);
  if (!r.ok) return { r, m };
  m.run(300000);
  return { r, m };
}

for (const loc of locales) {
  test(`Lehrbuch ${loc}: Kapitelliste, Titel, eindeutige Namen`, () => {
    const chapters = readIndex(loc);
    assert.ok(chapters.length > 0);
    const ids = new Set();
    for (const f of chapters) {
      const p = path.join(contentDir, loc, f);
      assert.ok(fs.existsSync(p), `fehlt: ${f}`);
      const blocks = parseMarkdown(fs.readFileSync(p, 'utf8'));
      assert.ok(chapterTitle(blocks), `${f}: keine Überschrift der Ebene 1`);
      const id = f.replace(/^\d+-/, '').replace(/\.md$/, '');
      assert.ok(!ids.has(id), `doppelt: ${id}`);
      ids.add(id);
    }
  });

  test(`Lehrbuch ${loc}: alle Verweise zeigen auf vorhandene Kapitel`, () => {
    const chapters = readIndex(loc);
    const ids = new Set(chapters.map((f) => f.replace(/^\d+-/, '').replace(/\.md$/, '')));
    const bad = [];
    for (const f of chapters) {
      const text = fs.readFileSync(path.join(contentDir, loc, f), 'utf8');
      for (const m of text.matchAll(/\]\(#([^)]+)\)/g)) if (!ids.has(m[1])) bad.push(`${f}: #${m[1]}`);
    }
    assert.deepEqual(bad, []);
  });

  test(`Lehrbuch ${loc}: Codebeispiele übersetzen und liefern die angegebenen Werte`, () => {
    const problems = [];
    let blocksChecked = 0;
    let expectsChecked = 0;
    for (const f of readIndex(loc)) {
      const blocks = parseMarkdown(fs.readFileSync(path.join(contentDir, loc, f), 'utf8'));
      collectCode(blocks).forEach((b, n) => {
        if (b.lang !== 'asm' || b.info.includes('nocheck')) return;
        const where = `${f} Block ${n + 1}`;
        const { r, m } = runBlock(b.code);
        blocksChecked++;
        if (!r.ok) { problems.push(`${where}: ${r.errors.map((e) => `Z${e.line} ${e.key}`).join(', ')}`); return; }
        const expect = parseExpect(b.info);
        if (!expect) return;
        expectsChecked++;
        for (const e of expect) {
          let actual;
          if (typeof e.target === 'number') actual = m.mem.peek(e.target);
          else if (e.target === 'A') actual = m.cpu.a;
          else if (e.target === 'X') actual = m.cpu.x;
          else if (e.target === 'Y') actual = m.cpu.y;
          else if (e.target === 'SP') actual = m.cpu.sp;
          else actual = m.cpu[e.target.toLowerCase()]; // Flags C Z N V D I
          if (actual !== e.value) problems.push(`${where}: ${e.target} ist ${actual}, erwartet ${e.value}`);
        }
        if (m.stopReason !== 'brk') problems.push(`${where}: Programm endet nicht mit BRK (${m.stopReason})`);
      });
    }
    assert.deepEqual(problems, []);
    assert.ok(blocksChecked > 0);
    void expectsChecked;
  });
}

test('Beispielbibliothek: Einträge verweisen auf vorhandene Dateien und lassen sich übersetzen', () => {
  const idx = JSON.parse(fs.readFileSync(path.join(root, 'examples', 'index.json'), 'utf8')).examples;
  const problems = [];
  for (const e of idx) {
    const p = path.join(root, 'examples', e.file);
    if (!fs.existsSync(p)) { problems.push(`fehlt: ${e.file}`); continue; }
    const m = new Machine();
    const r = m.assembleAndLoad(fs.readFileSync(p, 'utf8'));
    if (!r.ok) problems.push(`${e.file}: ${r.errors[0].key}`);
    for (const l of ['de', 'en']) if (!e.title?.[l] || !e.description?.[l]) problems.push(`${e.file}: Text ${l} fehlt`);
  }
  const files = fs.readdirSync(path.join(root, 'examples')).filter((f) => f.endsWith('.asm'));
  for (const f of files) if (!idx.some((e) => e.file === f)) problems.push(`nicht im Verzeichnis: ${f}`);
  assert.deepEqual(problems, []);
});
