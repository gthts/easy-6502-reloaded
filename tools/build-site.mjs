// Stellt die auszuliefernde Seite in _site/ zusammen (für GitHub Pages). Ohne Pakete: node tools/build-site.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '_site');

// Alles, was die Seite braucht – nichts von Tests, Werkzeugen, Planung oder den Originalen unter upstream/
const include = ['index.html', 'src', 'content', 'examples', 'LICENSE', 'NOTICE.md', '.nojekyll'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of include) {
  const from = path.join(root, item);
  if (!fs.existsSync(from)) { console.error(`fehlt: ${item}`); process.exit(1); }
  fs.cpSync(from, path.join(out, item), { recursive: true });
}

let files = 0;
let bytes = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else { files++; bytes += fs.statSync(p).size; }
  }
})(out);
console.log(`_site: ${files} Dateien, ${(bytes / 1024).toFixed(0)} KiB`);
