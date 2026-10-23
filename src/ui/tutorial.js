// Lehrbuch: lädt die Kapitel (Markdown) der gewählten Sprache, zeigt eines davon, Kapitelmarken,
// Lesefortschritt, Suche und Codebeispiele mit „An Emulator senden“.
import { parseMarkdown, chapterTitle, blocksText, parseExpect } from './markdown.js';
import { highlightLine } from './highlight.js';
import { store } from './storage.js';
import { t, getLocale, availableLocales } from '../i18n/index.js';

const hex = (v, n) => `$${v.toString(16).toUpperCase().padStart(n, '0')}`;

// Fügt geparste Inline-Knoten als DOM ein
function appendInline(parent, nodes, onLink) {
  for (const n of nodes) {
    if (n.t === 'text') parent.append(n.text);
    else if (n.t === 'code') { const c = document.createElement('code'); c.textContent = n.text; parent.append(c); }
    else if (n.t === 'strong' || n.t === 'em') {
      const e = document.createElement(n.t === 'strong' ? 'strong' : 'em');
      appendInline(e, n.children, onLink);
      parent.append(e);
    } else if (n.t === 'link') {
      const a = document.createElement('a');
      if (n.href.startsWith('#')) {
        a.href = n.href;
        a.addEventListener('click', (e) => { e.preventDefault(); onLink(n.href.slice(1)); });
      } else if (/^https?:\/\//.test(n.href)) {
        a.href = n.href;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      } else {
        a.className = 'dead-link';
      }
      appendInline(a, n.children, onLink);
      parent.append(a);
    }
  }
}

function expectText(expect) {
  return expect.map((e) => (typeof e.target === 'number' ? `${hex(e.target, 4)} = ${hex(e.value, 2)}` : `${e.target} = ${hex(e.value, 2)}`)).join(', ');
}

export function createTutorial({ ui, onSend, onSendRun }) {
  let chapters = []; // { id, title, blocks, text }
  let current = 0;
  let read = new Set(store.get('tutorialRead', []));
  let loadedLocale = null;

  // ---- Darstellung ------------------------------------------------------------

  function renderBlocks(parent, blocks) {
    for (const b of blocks) parent.append(renderBlock(b));
  }

  function renderBlock(b) {
    const link = (id) => open(id);
    switch (b.type) {
      case 'heading': {
        const h = document.createElement(`h${Math.min(6, b.level + 1)}`); // H1 des Kapitels wird als h2 gezeigt
        appendInline(h, b.children, link);
        return h;
      }
      case 'p': { const p = document.createElement('p'); appendInline(p, b.children, link); return p; }
      case 'ul': case 'ol': {
        const l = document.createElement(b.type);
        for (const it of b.items) { const li = document.createElement('li'); appendInline(li, it, link); l.append(li); }
        return l;
      }
      case 'quote': { const q = document.createElement('blockquote'); renderBlocks(q, b.children); return q; }
      case 'table': {
        const tbl = document.createElement('table');
        const head = tbl.createTHead().insertRow();
        for (const c of b.head) { const th = document.createElement('th'); appendInline(th, c, link); head.append(th); }
        const body = tbl.createTBody();
        for (const r of b.rows) { const tr = body.insertRow(); for (const c of r) { appendInline(tr.insertCell(), c, link); } }
        const wrap = document.createElement('div');
        wrap.className = 'tbl';
        wrap.append(tbl);
        return wrap;
      }
      case 'code': return renderCode(b);
      case 'container': return renderContainer(b);
      default: return document.createComment('');
    }
  }

  function renderContainer(b) {
    const titles = { hinweis: t('tutorial.note'), merke: t('tutorial.remember'), aufgabe: t('tutorial.task'), loesung: t('tutorial.solution') };
    if (b.kind === 'loesung') {
      const d = document.createElement('details');
      d.className = 'box loesung';
      const s = document.createElement('summary');
      s.textContent = b.title || titles.loesung;
      d.append(s);
      renderBlocks(d, b.children);
      return d;
    }
    const div = document.createElement('div');
    div.className = `box ${b.kind}`;
    const head = document.createElement('div');
    head.className = 'box-title';
    head.textContent = b.title ? `${titles[b.kind]}: ${b.title}` : titles[b.kind];
    div.append(head);
    renderBlocks(div, b.children);
    return div;
  }

  function renderCode(b) {
    const wrap = document.createElement('div');
    wrap.className = 'codebox';
    const pre = document.createElement('pre');
    pre.className = 'code';
    const code = document.createElement('code');
    if (b.lang === 'asm') code.innerHTML = b.code.split('\n').map(highlightLine).join('\n');
    else code.textContent = b.code;
    pre.append(code);
    wrap.append(pre);
    if (b.lang === 'asm') {
      const bar = document.createElement('div');
      bar.className = 'codebar';
      const send = document.createElement('button');
      send.type = 'button';
      send.textContent = t('tutorial.send');
      send.title = t('tutorial.sendTip');
      send.addEventListener('click', () => onSend(b.code));
      const run = document.createElement('button');
      run.type = 'button';
      run.textContent = t('tutorial.sendRun');
      run.title = t('tutorial.sendRunTip');
      run.addEventListener('click', () => onSendRun(b.code));
      bar.append(send, run);
      const expect = parseExpect(b.info);
      if (expect) {
        const e = document.createElement('span');
        e.className = 'expect';
        e.textContent = `${t('tutorial.expect')}: ${expectText(expect)}`;
        bar.append(e);
      }
      wrap.append(bar);
    }
    return wrap;
  }

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
  };
}
