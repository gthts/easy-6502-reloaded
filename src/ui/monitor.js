// Monitor: immer aktiv, 16 Zeilen à 16 Bytes. Springen zu Adresse/Marke, Blättern, Suchen (Hexbytes, Text, ??),
// Überschreiben von Bytes (Byte anklicken, Hexziffern tippen) mit Pfeiltasten zum Bewegen.
import { hex2, hex4 } from '../core/disassembler.js';
import { parseAddress, parseSearch } from '../core/search.js';
import { t } from '../i18n/index.js';

const ROWS = 16;
const COLS = 16;
const SIZE = ROWS * COLS;
const FLASH_MS = 700;

export function createMonitor(root, ui, machine) {
  let start = 0x0200;
  let cursor = 0x0200;
  let pending = null; // erste eingetippte Hexziffer
  let textMode = false; // Eingabe in der Textspalte: jede Taste schreibt ihren Zeichencode
  let hit = null; // { addr, len } letzter Fund
  let lastPattern = null;
  const addrCells = [];
  const byteCells = [];
  const ascCells = [];
  const prevValues = new Uint8Array(SIZE);
  const flashUntil = new Float64Array(SIZE);
  let needs = true;
  let lastRender = 0;
  let shownStart = -1;

  for (let r = 0; r < ROWS; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'mrow';
    const a = document.createElement('span');
    a.className = 'addr';
    const bytes = document.createElement('span');
    bytes.className = 'bytes';
    for (let c = 0; c < COLS; c++) {
      const b = document.createElement('span');
      b.dataset.i = String(r * COLS + c);
      byteCells.push(b);
      bytes.append(b);
    }
    const asc = document.createElement('span');
    asc.className = 'asc';
    for (let c = 0; c < COLS; c++) {
      const s = document.createElement('span');
      s.dataset.i = String(r * COLS + c);
      ascCells.push(s);
      asc.append(s);
    }
    addrCells.push(a);
    rowEl.append(a, bytes, asc);
    root.append(rowEl);
  }

  function say(key, params) {
    ui.note.textContent = key ? t(key, params) : '';
  }

  function show(addr) {
    start = Math.max(0, Math.min(0x10000 - SIZE, addr & 0xfff0));
    ui.goto.value = `$${hex4(start)}`;
    needs = true;
  }

  function scroll(rows) {
    show(start + rows * COLS);
  }

  function moveCursor(delta) {
    pending = null;
    cursor = Math.max(0, Math.min(0xffff, cursor + delta));
    if (cursor < start) show(cursor);
    else if (cursor >= start + SIZE) show(cursor - SIZE + COLS);
    needs = true;
  }

  // ---- Springen und Blättern -----------------------------------------------------

  ui.goto.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const a = parseAddress(ui.goto.value, machine.labels);
    if (a === null) { ui.goto.select(); return; }
    cursor = a;
    pending = null;
    show(a);
  });
  ui.prev.addEventListener('click', () => scroll(-ROWS));
  ui.next.addEventListener('click', () => scroll(ROWS));
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    scroll(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });

  // ---- Bearbeiten -------------------------------------------------------------------

  root.addEventListener('pointerdown', (e) => {
    const cell = e.target.closest('.bytes span, .asc span');
    if (!cell) return;
    textMode = !!cell.closest('.asc');
    cursor = start + Number(cell.dataset.i);
    pending = null;
    needs = true;
    root.focus();
  });
  root.addEventListener('blur', () => { pending = null; needs = true; });

  root.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (textMode && e.key.length === 1 && e.key.charCodeAt(0) <= 0xff) {
      // Textspalte: das getippte Zeichen wird als Byte geschrieben
      e.preventDefault();
      machine.mem.poke(cursor, e.key.charCodeAt(0));
      moveCursor(1);
      return;
    }
    if (!textMode && /^[0-9a-fA-F]$/.test(e.key)) {
      e.preventDefault();
      if (pending === null) pending = e.key;
      else {
        machine.mem.poke(cursor, parseInt(pending + e.key, 16));
        pending = null;
        moveCursor(1);
      }
      needs = true;
      return;
    }
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS }[e.key];
    if (step !== undefined) { e.preventDefault(); moveCursor(step); return; }
    if (e.key === 'PageUp') { e.preventDefault(); scroll(-ROWS); }
    else if (e.key === 'PageDown') { e.preventDefault(); scroll(ROWS); }
    else if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); pending = null; needs = true; }
  });

  // ---- Suchen --------------------------------------------------------------------------

  function search(fromNext) {
    const pattern = fromNext && lastPattern ? lastPattern : parseSearch(ui.find.value);
    if (!pattern) { say('monitor.badPattern'); return; }
    lastPattern = pattern;
    const from = fromNext && hit ? hit.addr + 1 : start;
    const a = machine.mem.find(pattern, from, true);
    if (a < 0) { hit = null; say('monitor.notFound'); needs = true; return; }
    hit = { addr: a, len: pattern.length };
    cursor = a;
    pending = null;
    show(a);
    say('monitor.found', { addr: `$${hex4(a)}` });
  }
  ui.find.addEventListener('keydown', (e) => { if (e.key === 'Enter') search(false); });
  ui.findBtn.addEventListener('click', () => search(false));
  ui.findNext.addEventListener('click', () => search(true));
  ui.find.addEventListener('input', () => { hit = null; lastPattern = null; needs = true; say(); });

  // ---- Zeichnen (höchstens etwa 20-mal je Sekunde, unabhängig von der Emulatorgeschwindigkeit) -----

  function update(now) {
    if (!needs && now - lastRender < 50) return;
    lastRender = now;
    const data = machine.mem.data;
    if (start !== shownStart) {
      // Ansicht verschoben: Vergleichswerte neu setzen, damit nichts aufblitzt
      for (let i = 0; i < SIZE; i++) prevValues[i] = data[start + i];
      flashUntil.fill(0);
      shownStart = start;
    }
    for (let i = 0; i < SIZE; i++) {
      const addr = start + i;
      const v = data[addr];
      const cell = byteCells[i];
      if (v !== prevValues[i]) {
        prevValues[i] = v;
        flashUntil[i] = now + FLASH_MS;
      }
      const text = addr === cursor && pending !== null ? `${pending.toUpperCase()}_` : hex2(v);
      if (cell.textContent !== text) cell.textContent = text;
      const cls = [];
      if (flashUntil[i] > now) cls.push('chg');
      if (addr === cursor) cls.push(textMode ? 'cur-soft' : 'cur');
      if (hit && addr >= hit.addr && addr < hit.addr + hit.len) cls.push('hit');
      const c = cls.join(' ');
      if (cell.className !== c) cell.className = c;
    }
    for (let r = 0; r < ROWS; r++) addrCells[r].textContent = hex4(start + r * COLS);
    for (let i = 0; i < SIZE; i++) {
      const addr = start + i;
      const v = data[addr];
      const cell = ascCells[i];
      const ch = v >= 0x20 && v < 0x7f ? String.fromCharCode(v) : '.';
      if (cell.textContent !== ch) cell.textContent = ch;
      const cls = [];
      if (flashUntil[i] > now) cls.push('chg');
      if (addr === cursor) cls.push(textMode ? 'cur' : 'cur-soft');
      if (hit && addr >= hit.addr && addr < hit.addr + hit.len) cls.push('hit');
      const c = cls.join(' ');
      if (cell.className !== c) cell.className = c;
    }
    needs = false;
  }

  show(start);
  return { update, goto: show };
}
