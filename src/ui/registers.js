// Registeranzeige: A, X, Y, SP, PC und Flags sind direkt bearbeitbar; A, X, Y auch binär; dazu Stapel und Zähler.
import { t } from '../i18n/index.js';
import { hex2, hex4 } from '../core/disassembler.js';

const FLAGS = [
  ['N', 'n', 7], ['V', 'v', 6], ['-', null, 5], ['B', null, 4], ['D', 'd', 3], ['I', 'i', 2], ['Z', 'z', 1], ['C', 'c', 0],
];
const STACK_SHOWN = 8;

const bin8 = (v) => {
  const b = v.toString(2).padStart(8, '0');
  return `%${b.slice(0, 4)} ${b.slice(4)}`;
};

export function createRegisters(root, machine, onChange) {
  const cpu = machine.cpu;
  const inputs = {};
  const extras = {};
  const labelCells = {};

  function row(key, caption) {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = caption ?? '';
    labelCells[key] = dt;
    root.append(dt, dd);
    return dd;
  }

  function numberRow(key, caption, digits, read, write, withDec, withBin) {
    const dd = row(key, caption);
    const input = document.createElement('input');
    input.className = digits === 4 ? 'reg-in wide mono' : 'reg-in mono';
    input.maxLength = digits + 1;
    input.spellcheck = false;
    input.autocomplete = 'off';
    input.setAttribute('aria-label', caption);
    const commit = () => {
      const m = /^\$?([0-9a-fA-F]{1,4})$/.exec(input.value.trim());
      if (m) {
        const v = parseInt(m[1], 16);
        if (v <= (digits === 2 ? 0xff : 0xffff)) { write(v); onChange?.(); }
      }
      input.value = read() === undefined ? '' : fmt(read());
    };
    const fmt = (v) => `$${digits === 2 ? hex2(v) : hex4(v)}`;
    input.addEventListener('change', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      else if (e.key === 'Escape') { input.value = fmt(read()); input.blur(); }
    });
    input.addEventListener('focus', () => input.select());
    dd.append(input);
    const ex = {};
    if (withDec) { ex.dec = document.createElement('span'); ex.dec.className = 'dec'; dd.append(ex.dec); }
    if (withBin) { ex.bin = document.createElement('span'); ex.bin.className = 'bin'; dd.append(ex.bin); }
    inputs[key] = { input, read, fmt, ex };
  }

  numberRow('A', 'A', 2, () => cpu.a, (v) => { cpu.a = v; }, true, true);
  numberRow('X', 'X', 2, () => cpu.x, (v) => { cpu.x = v; }, true, true);
  numberRow('Y', 'Y', 2, () => cpu.y, (v) => { cpu.y = v; }, true, true);
  numberRow('SP', 'SP', 2, () => cpu.sp, (v) => { cpu.sp = v; }, true, false);
  numberRow('PC', 'PC', 4, () => cpu.pc, (v) => { machine.jumpTo(v); }, false, false);

  // Flags: N V D I Z C lassen sich umschalten, „-“ und B nur anzeigen
  const flagDd = row('P', 'P');
  const flagEls = FLAGS.map(([name, prop]) => {
    const el = document.createElement(prop ? 'button' : 'span');
    el.textContent = name;
    el.className = 'flag off';
    if (prop) {
      el.type = 'button';
      el.addEventListener('click', () => { cpu[prop] ^= 1; onChange?.(); });
    }
    flagDd.append(el);
    return el;
  });

  extras.stack = row('stack', '');
  extras.stack.className = 'stack-line';
  extras.cycles = row('cycles', '');
  extras.instr = row('instr', '');

  function retranslate() {
    labelCells.stack.textContent = t('reg.stack');
    labelCells.cycles.textContent = t('reg.cycles');
    labelCells.instr.textContent = t('reg.instructions');
    for (const f of flagEls) if (f.tagName === 'BUTTON') f.title = t('reg.flagToggle');
  }
  retranslate();

  const last = {};
  const setText = (el, key, text) => {
    if (last[key] !== text) { last[key] = text; el.textContent = text; }
  };

  function update() {
    for (const [key, r] of Object.entries(inputs)) {
      const v = r.read();
      const text = r.fmt(v);
      if (document.activeElement !== r.input && r.input.value !== text) r.input.value = text;
      if (r.ex.dec) setText(r.ex.dec, `${key}d`, String(v).padStart(3, ' '));
      if (r.ex.bin) setText(r.ex.bin, `${key}b`, bin8(v));
    }
    const p = cpu.p | (cpu.halted && cpu.haltReason === 'brk' ? 0x10 : 0);
    if (last.p !== p) {
      last.p = p;
      FLAGS.forEach(([, , bit], i) => { flagEls[i].className = `flag ${bit !== 5 && (p >> bit) & 1 ? 'on' : 'off'}`; });
    }
    const bytes = [];
    for (let a = cpu.sp + 1; a <= 0xff && bytes.length < STACK_SHOWN; a++) bytes.push(hex2(machine.mem.peek(0x100 + a)));
    setText(extras.stack, 'stack', bytes.length ? bytes.join(' ') + (cpu.sp + 1 + bytes.length <= 0xff ? ' …' : '') : '—');
    setText(extras.cycles, 'cycles', String(cpu.cycles));
    setText(extras.instr, 'instr', String(machine.instructions));
  }
  return { update, retranslate };
}
