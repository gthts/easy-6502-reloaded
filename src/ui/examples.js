// Beispielbibliothek: examples/index.json beschreibt die Programme; die Auswahl lädt eines in den Editor.
import { t, getLocale } from '../i18n/index.js';

export function createExamples({ select, onLoad }) {
  let list = [];

  const text = (obj) => (typeof obj === 'string' ? obj : obj?.[getLocale()] ?? obj?.en ?? obj?.de ?? '');

  function relabel() {
    select.replaceChildren();
    const first = document.createElement('option');
    first.value = '';
    first.textContent = t('examples.pick');
    select.append(first);
    for (const group of ['tutorial', 'demo', 'game']) {
      const items = list.filter((e) => e.group === group);
      if (!items.length) continue;
      const og = document.createElement('optgroup');
      og.label = t(`examples.group.${group}`);
      for (const e of items) {
        const o = document.createElement('option');
        o.value = e.file;
        o.textContent = `${text(e.title)} · ${t(`examples.level.${e.level}`)}`;
        o.title = text(e.description);
        og.append(o);
      }
      select.append(og);
    }
  }

  select.addEventListener('change', async () => {
    const e = list.find((x) => x.file === select.value);
    select.value = '';
    if (!e) return;
    try {
      const code = await (await fetch(`examples/${e.file}`, { cache: 'no-cache' })).text();
      onLoad(text(e.title), code.replace(/\r\n?/g, '\n'));
    } catch {
      /* Datei nicht erreichbar: nichts ändern */
    }
  });

  (async () => {
    try {
      list = (await (await fetch('examples/index.json', { cache: 'no-cache' })).json()).examples;
    } catch {
      list = [];
    }
    relabel();
  })();

  return { relabel };
}
