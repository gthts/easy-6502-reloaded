// Disassembler: einzelne Instruktion, Bereich und Rückwärtsansicht.

import { OPCODES } from './opcodes.js';

const hex2 = (v) => v.toString(16).toUpperCase().padStart(2, '0');
const hex4 = (v) => v.toString(16).toUpperCase().padStart(4, '0');

/**
 * Zerlegt die Instruktion an `addr`.
 * @param {(addr:number)=>number} read  Lesefunktion ohne Nebenwirkungen (z. B. memory.peek)
 * @param {Object<number,string>} [namesByAddr]  Adresse -> Markenname (für Operanden)
 */
export function disassembleOne(read, addr, namesByAddr = null) {
  addr &= 0xffff;
  const opc = read(addr);
  const info = OPCODES[opc];
  if (!info) {
    return { addr, size: 1, bytes: [opc], mn: '???', mode: null, operand: `$${hex2(opc)}`, text: `.byte $${hex2(opc)}`, valid: false, target: null };
  }
  const bytes = [opc];
  for (let i = 1; i < info.size; i++) bytes.push(read((addr + i) & 0xffff));
  const lo = bytes[1];
  const word = info.size === 3 ? bytes[1] | (bytes[2] << 8) : 0;
  const name = (a, fallback) => (namesByAddr && namesByAddr[a] !== undefined ? namesByAddr[a] : fallback);
  let operand = '';
  let target = null;
  switch (info.mode) {
    case 'imp': break;
    case 'acc': operand = 'A'; break;
    case 'imm': operand = `#$${hex2(lo)}`; break;
    case 'zp': operand = name(lo, `$${hex2(lo)}`); target = lo; break;
    case 'zpx': operand = `${name(lo, `$${hex2(lo)}`)},X`; target = lo; break;
    case 'zpy': operand = `${name(lo, `$${hex2(lo)}`)},Y`; target = lo; break;
    case 'abs': operand = name(word, `$${hex4(word)}`); target = word; break;
    case 'abx': operand = `${name(word, `$${hex4(word)}`)},X`; target = word; break;
    case 'aby': operand = `${name(word, `$${hex4(word)}`)},Y`; target = word; break;
    case 'ind': operand = `(${name(word, `$${hex4(word)}`)})`; target = word; break;
    case 'izx': operand = `(${name(lo, `$${hex2(lo)}`)},X)`; target = lo; break;
    case 'izy': operand = `(${name(lo, `$${hex2(lo)}`)}),Y`; target = lo; break;
    case 'rel': {
      const dest = (addr + 2 + (lo < 0x80 ? lo : lo - 0x100)) & 0xffff;
      operand = name(dest, `$${hex4(dest)}`);
      target = dest;
      break;
    }
  }
  return {
    addr,
    size: info.size,
    bytes,
    mn: info.mn,
    mode: info.mode,
    operand,
    text: operand ? `${info.mn} ${operand}` : info.mn,
    valid: true,
    target,
  };
}

export function disassembleRange(read, start, count, namesByAddr = null) {
  const out = [];
  let a = start & 0xffff;
  for (let i = 0; i < count; i++) {
    const ins = disassembleOne(read, a, namesByAddr);
    out.push(ins);
    a = (a + ins.size) & 0xffff;
  }
  return out;
}

/**
 * Liefert bis zu `count` Instruktionen unmittelbar vor `addr`.
 * Rückwärts lässt sich der 6502-Befehlsstrom nicht eindeutig lesen; deshalb gilt:
 *   1. Bekannte Instruktionsanfänge (`knownStarts`, z. B. aus der Zuordnung Quelltext↔Adresse
 *      oder dem Ablaufprotokoll) haben Vorrang: der nächste bekannte Anfang, dessen Strom
 *      genau bei `addr` ankommt, dient als Anker.
 *   2. Sonst wird von weiter vorn in jeder Ausrichtung probiert; gewählt wird der Strom,
 *      der genau bei `addr` ankommt und keine ungültigen Opcodes enthält.
 */
export function disassembleBefore(read, addr, count, knownStarts = null, namesByAddr = null) {
  addr &= 0xffff;
  const chainFrom = (start) => {
    const list = [];
    let a = start;
    while (a < addr) {
      const ins = disassembleOne(read, a, namesByAddr);
      if (!ins.valid) return null;
      list.push(ins);
      a += ins.size;
    }
    return a === addr ? list : null;
  };

  let best = null;
  if (knownStarts) {
    const starts = [...knownStarts].filter((s) => s < addr && addr - s <= count * 3 + 16).sort((x, y) => y - x);
    for (const s of starts) {
      const c = chainFrom(s);
      if (c && c.length >= Math.min(count, 1)) { best = c; if (c.length >= count) break; }
    }
    if (best && best.length >= count) return best.slice(-count);
  }
  for (let s = Math.max(0, addr - count * 3 - 3); s < addr; s++) {
    const c = chainFrom(s);
    if (c && (!best || c.length > best.length)) {
      best = c;
      if (c.length >= count) break;
    }
  }
  return best ? best.slice(-count) : [];
}

export { hex2, hex4 };
