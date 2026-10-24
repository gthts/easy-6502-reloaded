// Prüft die vollständigen Lösungen der Übungskapitel. Sie liegen NICHT im Repository (Ordner intern/, siehe .gitignore),
// damit Studierende sie nicht einfach nachlesen können. Ohne den Ordner wird der Test übersprungen.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdown, collectCode, parseExpect } from '../src/ui/markdown.js';
import { Machine } from '../src/core/machine.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'intern', 'loesungen');
const present = fs.existsSync(dir);

test('Interne Lösungen der Übungskapitel übersetzen und liefern die angegebenen Werte', { skip: !present }, () => {
  const problems = [];
  let blocks = 0;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    collectCode(parseMarkdown(fs.readFileSync(path.join(dir, f), 'utf8'))).forEach((b, n) => {
      if (b.lang !== 'asm' || b.info.includes('nocheck')) return;
      const m = new Machine();
      const r = m.assembleAndLoad(b.code);
      blocks++;
      if (!r.ok) { problems.push(`${f} Block ${n + 1}: ${r.errors.map((e) => e.key).join(', ')}`); return; }
      m.run(300000);
      for (const e of parseExpect(b.info) ?? []) {
        const actual = typeof e.target === 'number' ? m.mem.peek(e.target)
          : e.target === 'A' ? m.cpu.a : e.target === 'X' ? m.cpu.x : e.target === 'Y' ? m.cpu.y
            : e.target === 'SP' ? m.cpu.sp : m.cpu[e.target.toLowerCase()];
        if (actual !== e.value) problems.push(`${f} Block ${n + 1}: ${e.target} ist ${actual}, erwartet ${e.value}`);
      }
    });
  }
  assert.deepEqual(problems, []);
  assert.ok(blocks > 20);
});
