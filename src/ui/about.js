// Seite „Über“: Lizenzen, Herkunft, Datenschutz. Der Text steht je Sprache in content/<sprache>/about.md.
import { parseMarkdown } from './markdown.js';
import { createRenderer } from './render.js';
import { getLocale, availableLocales } from '../i18n/index.js';

export function createAbout({ dialog, openBtn, closeBtn, body }) {
  let blocks = null;
  let loaded = null;

  async function load() {
    const order = [getLocale(), 'en', ...availableLocales()].filter((x, i, a) => a.indexOf(x) === i);
    for (const l of order) {
      try {
        const res = await fetch(`content/${l}/about.md`, { cache: 'no-cache' });
        if (!res.ok) continue;
        blocks = parseMarkdown(await res.text());
        loaded = l;
        return;
      } catch {
        /* nächste Sprache */
      }
    }
  }

  function render() {
    body.replaceChildren();
    if (blocks) createRenderer({}).renderBlocks(body, blocks);
  }

  async function open() {
    if (loaded !== getLocale()) { await load(); render(); }
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', () => dialog.close());
  // Klick auf den Hintergrund schließt
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });

  return { reload: async () => { if (dialog.open) { await load(); render(); } else loaded = null; } };
}
