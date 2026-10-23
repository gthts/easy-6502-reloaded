// Lehrbuch: lädt die Kapitel (Markdown) der gewählten Sprache, zeigt eines davon, Kapitelmarken,
// Lesefortschritt, Suche und Codebeispiele mit „An Emulator senden“.
import { parseMarkdown, chapterTitle, blocksText } from './markdown.js';
import { createRenderer } from './render.js';
import { store } from './storage.js';
import { t, getLocale, availableLocales } from '../i18n/index.js';

export function createTutorial({ ui, onSend, onSendRun, onRef }) {
  const renderer = createRenderer({ onLink: (id) => open(id), onRef, onSend, onSendRun });
  const renderBlocks = (parent, blocks) => renderer.renderBlocks(parent, blocks);
  let chapters = []; // { id, title, blocks, text }
  let current = 0;
  let read = new Set(store.get('tutorialRead', []));
  let loadedLocale = null;

  // ---- Darstellung ------------------------------------------------------------

  function renderMarks() {
    ui.marks.replaceChildren();
    chapters.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mark' + (i === current ? ' cur' : '') + (read.has(c.id) ? ' done' : '');
      b.title = `${i + 1}. ${c.title}`;
      b.setAttribute('aria-label', b.title);
      b.addEventListener('click', () => open(c.id));
      ui.marks.append(b);
    });
    const opts = [...ui.select.options];
    opts.forEach((o, i) => { o.textContent = `${i + 1}. ${chapters[i].title}${read.has(chapters[i].id) ? ' ✓' : ''}`; });
  }

  function show(index, scrollToTop = true) {
    if (!chapters.length) return;
    current = Math.max(0, Math.min(chapters.length - 1, index));
    const c = chapters[current];
    ui.content.replaceChildren();
    const h = document.createElement('h2');
    h.className = 'chapter-title';
    h.textContent = c.title;
    ui.content.append(h);
    renderBlocks(ui.content, c.blocks.filter((b) => !(b.type === 'heading' && b.level === 1)));
    ui.select.value = String(current);
    ui.prev.disabled = current === 0;
    ui.next.disabled = current === chapters.length - 1;
    ui.pos.textContent = `${current + 1} / ${chapters.length}`;
    store.set('tutorialChapter', c.id);
    if (scrollToTop) ui.scroller.scrollTop = 0;
    renderMarks();
    checkRead();
  }

  function open(id) {
    const i = chapters.findIndex((c) => c.id === id);
    if (i >= 0) { ui.results.replaceChildren(); show(i); }
  }

  function markRead(id) {
    if (read.has(id)) return;
    read.add(id);
    store.set('tutorialRead', [...read]);
    renderMarks();
  }

  // Ein Kapitel gilt als gelesen, wenn man bis zum Ende gescrollt hat (oder es nicht scrollbar ist)
  function checkRead() {
    const s = ui.scroller;
    if (!chapters.length || s.clientHeight === 0) return; // Bereich eingeklappt oder noch nicht sichtbar
    if (s.scrollHeight - s.clientHeight - s.scrollTop < 40) markRead(chapters[current].id);
  }
  ui.scroller.addEventListener('scroll', checkRead);

  ui.prev.addEventListener('click', () => show(current - 1));
  ui.next.addEventListener('click', () => { markRead(chapters[current].id); show(current + 1); });
  ui.select.addEventListener('change', () => show(Number(ui.select.value)));

  // ---- Suche ------------------------------------------------------------------

  ui.search.addEventListener('input', () => {
    const q = ui.search.value.trim().toLowerCase();
    ui.results.replaceChildren();
    if (q.length < 2) return;
    const hits = [];
    chapters.forEach((c) => {
      const hay = c.text.toLowerCase();
      let n = 0;
      for (let p = hay.indexOf(q); p >= 0; p = hay.indexOf(q, p + q.length)) n++;
      if (n) hits.push({ c, n, at: hay.indexOf(q) });
    });
    if (!hits.length) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = t('tutorial.noHits');
      ui.results.append(li);
      return;
    }
    for (const { c, n, at } of hits) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      const snippet = c.text.slice(Math.max(0, at - 30), at + q.length + 40).replace(/\s+/g, ' ');
      b.textContent = `${c.title} (${n}) – …${snippet}…`;
      b.addEventListener('click', () => { ui.search.value = ''; open(c.id); });
      li.append(b);
      ui.results.append(li);
    }
  });

  // ---- Laden ------------------------------------------------------------------

  async function load() {
    const loc = getLocale();
    // gewünschte Sprache, sonst die anderen vorhandenen (Rückfall)
    const order = [loc, 'en', ...availableLocales()].filter((x, i, a) => a.indexOf(x) === i);
    for (const l of order) {
      try {
        const idx = await (await fetch(`content/${l}/index.json`, { cache: 'no-cache' })).json();
        const files = await Promise.all(idx.chapters.map(async (f) => (await fetch(`content/${l}/${f}`, { cache: 'no-cache' })).text()));
        chapters = files.map((md, i) => {
          const blocks = parseMarkdown(md);
          const id = idx.chapters[i].replace(/^\d+-/, '').replace(/\.md$/, '');
          return { id, title: chapterTitle(blocks), blocks, text: blocksText(blocks) };
        });
        loadedLocale = l;
        break;
      } catch {
        /* nächste Sprache */
      }
    }
    ui.select.replaceChildren();
    chapters.forEach((c, i) => { const o = document.createElement('option'); o.value = String(i); ui.select.append(o); });
    ui.error.hidden = chapters.length > 0;
    const wanted = store.get('tutorialChapter', null);
    const idx = Math.max(0, chapters.findIndex((c) => c.id === wanted));
    show(idx, false);
  }

  return {
    load,
    // nach Sprachwechsel: Inhalt der neuen Sprache laden, Kapitel merken
    reload: () => (loadedLocale === getLocale() ? Promise.resolve(show(current, false)) : load()),
    open,
    titleOf: (id) => chapters.find((c) => c.id === id)?.title ?? null,
  };
}
