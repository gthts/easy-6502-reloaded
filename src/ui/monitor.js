// Monitor: immer aktiv, 16 Zeilen à 16 Bytes, springt zu Adresse oder Marke, blättert per Rad, Tasten und Knöpfen.
import { hex2, hex4 } from '../core/disassembler.js';

const ROWS = 16;
const COLS = 16;
const FLASH_MS = 700;

export function parseAddress(text, labels) {
  const s = text.trim();
  if (s in labels) return labels[s];
  const m = /^(?:\$|0x)?([0-9a-fA-F]{1,4})$/.exec(s);
  return m ? parseInt(m[1], 16) : null;
}

export function createMonitor(root, input, prevBtn, nextBtn, machine) {
  let start = 0x0200;
  const addrCells = [];
  const byteCells = [];
  const ascCells = [];
  const prevValues = new Uint8Array(ROWS * COLS);
  const flashUntil = new Float64Array(ROWS * COLS);

  for (let r = 0; r < ROWS; r++) {
    const rowEl = document.createElement('div');
    rowEl.className = 'mrow';
    const a = document.createElement('span');
    a.className = 'addr';
    const bytes = document.createElement('span');
    bytes.className = 'bytes';
    for (let c = 0; c < COLS; c++) {
      const b = document.createElement('span');
      byteCells.push(b);
      bytes.append(b);
    }
    const asc = document.createElement('span');
    asc.className = 'asc';
    addrCells.push(a);
    ascCells.push(asc);
    rowEl.append(a, bytes, asc);
    root.append(rowEl);
  }

  let needs = true;

  function goto(addr) {
    start = Math.max(0, Math.min(0x10000 - ROWS * COLS, addr & 0xfff0));
    input.value = `$${hex4(start)}`;
    needs = true;
  }

  function scroll(rows) {
    goto(start + rows * COLS);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const a = parseAddress(input.value, machine.labels);
    if (a !== null) goto(a);
    else input.select();
  });
  prevBtn.addEventListener('click', () => scroll(-ROWS));
  nextBtn.addEventListener('click', () => scroll(ROWS));
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    scroll(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  root.addEventListener('keydown', (e) => {
    const k = { ArrowUp: -1, ArrowDown: 1, PageUp: -ROWS, PageDown: ROWS }[e.key];
    if (k === undefined) return;
    e.preventDefault();
    scroll(k);
  });

  let lastRender = 0;

  // Zeichnet höchstens etwa 20-mal je Sekunde, unabhängig von der Emulatorgeschwindigkeit
  function update(now) {
    if (!needs && now - lastRender < 50) return;
    lastRender = now;
    const data = machine.mem.data;
    for (let i = 0; i < ROWS * COLS; i++) {
      const v = data[start + i];
      const cell = byteCells[i];
      if (needs) {
        prevValues[i] = v;
        flashUntil[i] = 0;
      } else if (v !== prevValues[i]) {
        prevValues[i] = v;
        flashUntil[i] = now + FLASH_MS;
      }
      const text = hex2(v);
      if (cell.textContent !== text) cell.textContent = text;
      const on = flashUntil[i] > now;
      if (cell.classList.contains('chg') !== on) cell.classList.toggle('chg', on);
    }
    for (let r = 0; r < ROWS; r++) {
      addrCells[r].textContent = hex4(start + r * COLS);
      let s = '';
      for (let c = 0; c < COLS; c++) {
        const v = data[start + r * COLS + c];
        s += v >= 0x20 && v < 0x7f ? String.fromCharCode(v) : '.';
      }
      if (ascCells[r].textContent !== s) ascCells[r].textContent = s;
    }
    needs = false;
  }

  goto(start);
  return { update, goto };
}
