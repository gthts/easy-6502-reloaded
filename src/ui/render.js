// Baut aus dem Markdown-Baum (markdown.js) DOM-Elemente. Gemeinsam genutzt von Lehrbuch und Referenz.
import { parseExpect } from './markdown.js';
import { highlightLine } from './highlight.js';
import { MNEMONICS } from '../core/opcodes.js';
import { t } from '../i18n/index.js';

const hex = (v, n) => `$${v.toString(16).toUpperCase().padStart(n, '0')}`;

function expectText(expect) {
  return expect.map((e) => (typeof e.target === 'number' ? `${hex(e.target, 4)} = ${hex(e.value, 2)}` : `${e.target} = ${hex(e.value, 2)}`)).join(', ');
}

/**
 * @param {{
 *   onLink?: (id:string)=>void,       Verweis auf ein Kapitel (#id)
 *   onRef?: (mnemonic:string)=>void,  Befehlsname angeklickt → Referenz
 *   onSend?: (code:string)=>void, onSendRun?: (code:string)=>void   Codebeispiel in den Editor
 * }} h
 */
export function createRenderer(h) {
  function appendInline(parent, nodes) {
    for (const n of nodes) {
      if (n.t === 'text') parent.append(n.text);
      else if (n.t === 'code') {
        const c = document.createElement('code');
        c.textContent = n.text;
        if (h.onRef && MNEMONICS.has(n.text)) {
          c.className = 'mn';
          c.dataset.mn = n.text;
          c.tabIndex = 0;
          c.setAttribute('role', 'link');
          c.title = t('ref.open');
          const go = () => h.onRef(n.text);
          c.addEventListener('click', go);
          c.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
        }
        parent.append(c);
      } else if (n.t === 'strong' || n.t === 'em') {
        const e = document.createElement(n.t === 'strong' ? 'strong' : 'em');
        appendInline(e, n.children);
        parent.append(e);
      } else if (n.t === 'link') {
        const a = document.createElement('a');
        if (n.href.startsWith('#')) {
          a.href = n.href;
          a.addEventListener('click', (e) => { e.preventDefault(); h.onLink?.(n.href.slice(1)); });
        } else if (/^https?:\/\//.test(n.href)) {
          a.href = n.href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        } else a.className = 'dead-link';
        appendInline(a, n.children);
        parent.append(a);
      }
    }
  }

  function renderBlocks(parent, blocks) {
    for (const b of blocks) parent.append(renderBlock(b));
  }

  function renderBlock(b) {
    switch (b.type) {
      case 'heading': {
        const el = document.createElement(`h${Math.min(6, b.level + 1)}`);
        appendInline(el, b.children);
        return el;
      }
      case 'p': { const p = document.createElement('p'); appendInline(p, b.children); return p; }
      case 'ul': case 'ol': {
        const l = document.createElement(b.type);
        for (const it of b.items) { const li = document.createElement('li'); appendInline(li, it); l.append(li); }
        return l;
      }
      case 'quote': { const q = document.createElement('blockquote'); renderBlocks(q, b.children); return q; }
      case 'table': {
        const tbl = document.createElement('table');
        const head = tbl.createTHead().insertRow();
        for (const c of b.head) { const th = document.createElement('th'); appendInline(th, c); head.append(th); }
        const body = tbl.createTBody();
        for (const r of b.rows) { const tr = body.insertRow(); for (const c of r) appendInline(tr.insertCell(), c); }
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
    if (b.lang === 'asm' && h.onSend) {
      const bar = document.createElement('div');
      bar.className = 'codebar';
      const send = document.createElement('button');
      send.type = 'button';
      send.textContent = t('tutorial.send');
      send.title = t('tutorial.sendTip');
      send.addEventListener('click', () => h.onSend(b.code));
      const run = document.createElement('button');
      run.type = 'button';
      run.textContent = t('tutorial.sendRun');
      run.title = t('tutorial.sendRunTip');
      run.addEventListener('click', () => h.onSendRun(b.code));
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

  return { appendInline, renderBlocks, renderBlock };
}
