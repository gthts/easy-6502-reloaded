// Registeranzeige: Werte werden nur geschrieben, wenn sie sich ändern.
import { t } from '../i18n/index.js';
import { hex2, hex4 } from '../core/disassembler.js';

const FLAGS = ['N', 'V', '-', 'B', 'D', 'I', 'Z', 'C'];

export function createRegisters(root, machine) {
  const cells = {};
  const labelCells = {};
  const defs = [
    ['A', 'A'], ['X', 'X'], ['Y', 'Y'], ['SP', 'SP'], ['PC', 'PC'], ['P', 'P'],
    ['cycles', null], ['instr', null],
  ];
  for (const [key, text] of defs) {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    labelCells[key] = dt;
    if (text) dt.textContent = text;
    cells[key] = dd;
    root.append(dt, dd);
  }
  const flagSpans = FLAGS.map((f) => {
    const s = document.createElement('span');
    s.textContent = f;
    s.className = 'flag off';
    return s;
  });
  cells.P.append(...flagSpans);

  const last = {};
  function retranslate() {
    labelCells.cycles.textContent = t('reg.cycles');
    labelCells.instr.textContent = t('reg.instructions');
  }
  retranslate();

  function update() {
    const c = machine.cpu;
    for (const k of ['A', 'X', 'Y', 'SP']) {
      const v = k === 'SP' ? c.sp : c[k.toLowerCase()];
      const text = `$${hex2(v)}  ${v.toString().padStart(3, ' ')}`;
      if (last[k] !== text) { last[k] = text; cells[k].textContent = text; }
    }
    const pcText = `$${hex4(c.pc)}`;
    if (last.PC !== pcText) { last.PC = pcText; cells.PC.textContent = pcText; }
    const p = c.p | (c.halted && c.haltReason === 'brk' ? 0x10 : 0);
    if (last.Pv !== p) {
      last.Pv = p;
      flagSpans.forEach((s, i) => { s.className = 'flag ' + ((p >> (7 - i)) & 1 ? 'on' : 'off'); });
    }
    const cy = String(c.cycles);
    if (last.cycles !== cy) { last.cycles = cy; cells.cycles.textContent = cy; }
    const ins = String(machine.instructions);
    if (last.instr !== ins) { last.instr = ins; cells.instr.textContent = ins; }
  }
  return { update, retranslate };
}
