// Referenz: Übersicht dieser Umgebung, Adressierungsarten, alle Befehle (mit Suche und Einzelansicht), Opcode-Tabelle.
// Sprungmarken oben im Kopf; von überall kann `show('LDA')` den Befehl öffnen.
import { parseMarkdown, parseInline } from './markdown.js';
import { createRenderer } from './render.js';
import { OPCODES, BY_MNEMONIC } from '../core/opcodes.js';
import { CATEGORIES, META, MODE_INFO, MODE_ORDER, FLAG_ORDER, chapterFor, flagEffects } from '../reference/data.js';
import { t, getLocale, availableLocales } from '../i18n/index.js';

const hex2 = (v) => v.toString(16).toUpperCase().padStart(2, '0');

export function createReference({ ui, reveal, onChapter, chapterTitle, onSend, onSendRun }) {
  let data = null; // { categories, modes, instructions }
  let overview = [];
  let loadedLocale = null;
  let current = null; // { mn, mode }

  const renderer = createRenderer({ onLink: onChapter, onRef: (mn) => show(mn), onSend, onSendRun });

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const inline = (parent, text) => renderer.appendInline(parent, parseInline(text));

  // ---- Aufbau --------------------------------------------------------------------

  const sections = {};
  function section(id, titleKey) {
    const s = el('section', 'ref-section');
    s.id = `ref-${id}`;
    const h = el('h3', null, t(titleKey));
    s.append(h);
    sections[id] = s;
    return s;
  }

  function buildOverview() {
    const s = section('overview', 'ref.nav.overview');
    const body = el('div', 'prose');
    // erste H1 („Übersicht“) entfällt, die Überschrift steht schon im Abschnittskopf
    renderer.renderBlocks(body, overview.filter((b) => !(b.type === 'heading' && b.level === 1)));
    s.append(body);
    return s;
  }

  function buildModes() {
    const s = section('modes', 'ref.nav.modes');
    const wrap = el('div', 'tbl');
    const tbl = document.createElement('table');
    const head = tbl.createTHead().insertRow();
    for (const k of ['ref.mode', 'ref.syntax', 'ref.example', 'ref.bytes']) head.append(Object.assign(document.createElement('th'), { textContent: t(k) }));
    const body = tbl.createTBody();
    for (const m of MODE_ORDER) {
      const info = MODE_INFO[m];
      const d = data.modes[m];
      const tr = body.insertRow();
      const name = tr.insertCell();
      const a = el('a', null, d.name);
      a.href = `#${info.chapter}`;
      a.addEventListener('click', (e) => { e.preventDefault(); onChapter(info.chapter); });
      a.title = t('ref.lesson');
      name.append(a);
      tr.insertCell().append(Object.assign(document.createElement('code'), { textContent: info.notation }));
      tr.insertCell().append(Object.assign(document.createElement('code'), { textContent: info.example }));
      tr.insertCell().textContent = String(sizeOf(m));
      const desc = body.insertRow();
      desc.className = 'desc';
      const c = desc.insertCell();
      c.colSpan = 4;
      inline(c, d.text);
    }
    wrap.append(tbl);
    s.append(wrap);
    return s;
  }

  function sizeOf(mode) {
    return { imp: 1, acc: 1, imm: 2, zp: 2, zpx: 2, zpy: 2, abs: 3, abx: 3, aby: 3, ind: 3, izx: 2, izy: 2, rel: 2 }[mode];
  }

  let chipBox;
  let detail;
  let noMatch;

  function buildInstructions() {
    const s = section('instr', 'ref.nav.instr');
    chipBox = el('div', 'chips');
    for (const cat of CATEGORIES) {
      const group = el('div', 'chip-group');
      group.dataset.cat = cat;
      group.append(el('div', 'chip-title', data.categories[cat]));
      const row = el('div', 'chip-row');
      for (const mn of Object.keys(META).filter((x) => META[x].cat === cat)) {
        const b = el('button', `chip cat-${cat}`, mn);
        b.type = 'button';
        b.dataset.mn = mn;
        b.title = data.instructions[mn].name;
        b.addEventListener('click', () => show(mn));
        row.append(b);
      }
      group.append(row);
      chipBox.append(group);
    }
    noMatch = el('p', 'muted', t('ref.noMatch'));
    noMatch.hidden = true;
    detail = el('div', 'ref-detail');
    detail.id = 'ref-detail';
    s.append(chipBox, noMatch, detail);
    return s;
  }

  function buildOpcodes() {
    const s = section('opcodes', 'ref.nav.opcodes');
    s.append(el('p', 'muted small', t('ref.opcodeHint')));
    const wrap = el('div', 'tbl opc');
    const tbl = document.createElement('table');
    tbl.className = 'opcodes';
    const head = tbl.createTHead().insertRow();
    head.append(document.createElement('th'));
    for (let c = 0; c < 16; c++) head.append(Object.assign(document.createElement('th'), { textContent: `x${c.toString(16).toUpperCase()}` }));
    const body = tbl.createTBody();
    for (let r = 0; r < 16; r++) {
      const tr = body.insertRow();
      tr.append(Object.assign(document.createElement('th'), { textContent: `${r.toString(16).toUpperCase()}x` }));
      for (let c = 0; c < 16; c++) {
        const op = r * 16 + c;
        const info = OPCODES[op];
        const td = tr.insertCell();
        if (!info) { td.className = 'unused'; td.textContent = '·'; td.title = `$${hex2(op)}: ${t('ref.unused')}`; continue; }
        td.className = `cat-${META[info.mn].cat}`;
        td.textContent = info.mn;
        td.title = `$${hex2(op)}: ${info.mn} ${MODE_INFO[info.mode].notation === '–' ? '' : MODE_INFO[info.mode].notation} · ${data.modes[info.mode].name}`;
        td.tabIndex = 0;
        const go = () => show(info.mn, info.mode);
        td.addEventListener('click', go);
        td.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
      }
    }
    wrap.append(tbl);
    s.append(wrap);
    const legend = el('div', 'legend');
    for (const cat of CATEGORIES) legend.append(el('span', `chip cat-${cat}`, data.categories[cat]));
    s.append(legend);
    return s;
  }

  // ---- Einzelansicht eines Befehls ------------------------------------------------------

  function renderDetail(mn, activeMode) {
    detail.replaceChildren();
    const meta = META[mn];
    const text = data.instructions[mn];
    const head = el('h4', 'ref-title');
    head.append(Object.assign(document.createElement('code'), { textContent: mn }), ` – ${text.name}`);
    detail.append(head);

    const op = el('div', 'ref-op');
    op.append(el('span', 'muted', `${t('ref.operation')}: `), Object.assign(document.createElement('code'), { textContent: meta.op }));
    detail.append(op);

    // Flags
    const eff = new Map(flagEffects(meta.flags).map((f) => [f.flag, f.fixed]));
    const fl = el('div', 'ref-flags');
    fl.append(el('span', 'muted', `${t('ref.flags')}: `));
    for (const f of FLAG_ORDER) {
      const s = el('span', 'flag');
      s.textContent = f;
      if (eff.has(f)) {
        const fixed = eff.get(f);
        s.classList.add('on');
        s.title = fixed === null ? t('ref.flagSet') : t(fixed ? 'ref.flagFixed1' : 'ref.flagFixed0');
        if (fixed !== null) s.textContent = `${f}=${fixed}`;
      } else s.classList.add('off');
      fl.append(s);
    }
    if (eff.size === 0) fl.append(el('span', 'muted', ` ${t('ref.notAffected')}`));
    detail.append(fl);

    const p = el('p');
    inline(p, text.text);
    detail.append(p);

    // Tabelle der Adressierungsarten
    const wrap = el('div', 'tbl');
    const tbl = document.createElement('table');
    const hr = tbl.createTHead().insertRow();
    for (const k of ['ref.mode', 'ref.syntax', 'ref.opcode', 'ref.bytes', 'ref.cycles']) hr.append(Object.assign(document.createElement('th'), { textContent: t(k) }));
    const body = tbl.createTBody();
    const modes = BY_MNEMONIC[mn];
    for (const m of MODE_ORDER.filter((x) => x in modes)) {
      const info = OPCODES[modes[m]];
      const tr = body.insertRow();
      if (m === activeMode) tr.className = 'active';
      tr.insertCell().textContent = data.modes[m].name;
      const syn = tr.insertCell();
      syn.append(Object.assign(document.createElement('code'), { textContent: syntaxOf(mn, m) }));
      tr.insertCell().textContent = `$${hex2(info.op)}`;
      tr.insertCell().textContent = String(info.size);
      const cy = tr.insertCell();
      cy.textContent = String(info.cycles) + (info.pageCross || m === 'rel' ? '+' : '');
      if (info.pageCross) cy.title = t('ref.cyclesPlus');
      if (m === 'rel') cy.title = t('ref.cyclesBranch');
    }
    wrap.append(tbl);
    detail.append(wrap);

    // Verweis ins Lehrbuch
    const ch = chapterFor(mn);
    const title = chapterTitle?.(ch);
    if (title) {
      const link = el('a', 'lesson', `${t('ref.lesson')}: ${title}`);
      link.href = `#${ch}`;
      link.addEventListener('click', (e) => { e.preventDefault(); onChapter(ch); });
      detail.append(link);
    }
  }

  function syntaxOf(mn, mode) {
    const n = MODE_INFO[mode].notation;
    return n === '–' ? mn : mode === 'acc' ? `${mn} A` : `${mn} ${n}`;
  }

  // ---- Bedienung -------------------------------------------------------------------

  function show(mn, mode = null) {
    if (!data || !META[mn]) return;
    reveal?.();
    // Suche zurücksetzen, damit der Befehl sichtbar ist
    if (ui.search.value) { ui.search.value = ''; filter(); }
    current = { mn, mode };
    renderDetail(mn, mode);
    for (const b of chipBox.querySelectorAll('.chip')) b.classList.toggle('sel', b.dataset.mn === mn);
    detail.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  function filter() {
    const q = ui.search.value.trim().toLowerCase();
    let any = false;
    for (const group of chipBox.querySelectorAll('.chip-group')) {
      let groupAny = false;
      for (const b of group.querySelectorAll('.chip')) {
        const mn = b.dataset.mn;
        const d = data.instructions[mn];
        const hit = !q || mn.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.text.toLowerCase().includes(q);
        b.hidden = !hit;
        if (hit) groupAny = true;
      }
      group.hidden = !groupAny;
      if (groupAny) any = true;
    }
    noMatch.hidden = any;
  }

  ui.search.addEventListener('input', filter);
  ui.search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = chipBox.querySelector('.chip:not([hidden])');
    if (first) show(first.dataset.mn);
  });
  for (const a of ui.links.querySelectorAll('[data-target]')) {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      sections[a.dataset.target]?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  }

  // ---- Laden ----------------------------------------------------------------------

  function render() {
    ui.content.replaceChildren();
    if (!data) return;
    ui.content.append(buildOverview(), buildModes(), buildInstructions(), buildOpcodes());
    if (ui.search.value) filter();
    if (current) { renderDetail(current.mn, current.mode); for (const b of chipBox.querySelectorAll('.chip')) b.classList.toggle('sel', b.dataset.mn === current.mn); }
  }

  async function load() {
    const order = [getLocale(), 'en', ...availableLocales()].filter((x, i, a) => a.indexOf(x) === i);
    for (const l of order) {
      try {
        const json = await (await fetch(`content/${l}/reference.json`, { cache: 'no-cache' })).json();
        const md = await (await fetch(`content/${l}/reference.md`, { cache: 'no-cache' })).text();
        data = json;
        overview = parseMarkdown(md);
        loadedLocale = l;
        break;
      } catch {
        /* nächste Sprache */
      }
    }
    ui.error.hidden = !!data;
    render();
  }

  return {
    load,
    show,
    reload: () => (loadedLocale === getLocale() ? Promise.resolve(render()) : load()),
  };
}
