// Disassemblierfenster: frei wählbarer Bereich (16 Instruktionen), unabhängig vom Programmzähler – oder ihm folgend.
import { disassembleBefore, disassembleRange, hex4 } from '../core/disassembler.js';
import { parseAddress } from '../core/search.js';
import { buildRow, buildLabelRow, fillLabelSelect } from './flow.js';

const LINES = 16;

export function createDisasm(root, ui, machine, onToggleBp) {
  let start = 0x0600;
  let sig = '';
  let follow = false;

  const read = (a) => machine.mem.peek(a);

  function goto(addr) {
    start = addr & 0xffff;
    ui.input.value = `$${hex4(start)}`;
    sig = '';
  }

  function scroll(n) {
    const known = new Set(machine.lineMap.map((l) => l.addr));
    if (n < 0) {
      const before = disassembleBefore(read, start, -n, known);
      if (before.length) goto(before[0].addr);
      else goto(start - 1);
    } else {
      const list = disassembleRange(read, start, n + 1);
      goto(list[n].addr);
    }
  }

  ui.input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const a = parseAddress(ui.input.value, machine.labels);
    if (a !== null) { ui.follow.checked = false; follow = false; goto(a); }
    else ui.input.select();
  });
  ui.select.addEventListener('change', () => {
    if (!ui.select.value) return;
    ui.follow.checked = false;
    follow = false;
    goto(machine.labels[ui.select.value]);
  });
  ui.prevBtn.addEventListener('click', () => scroll(-LINES));
  ui.nextBtn.addEventListener('click', () => scroll(LINES));
  ui.follow.addEventListener('change', () => { follow = ui.follow.checked; sig = ''; });
  root.addEventListener('wheel', (e) => {
    e.preventDefault();
    follow = false;
    ui.follow.checked = false;
    scroll(e.deltaY > 0 ? 3 : -3);
  }, { passive: false });
  root.addEventListener('click', (e) => {
    const r = e.target.closest('.row');
    if (r) onToggleBp(Number(r.dataset.addr));
  });

  function update(rev, memRev) {
    if (follow) {
      const before = disassembleBefore(read, machine.cpu.pc, 3, null);
      const a = before.length ? before[0].addr : machine.cpu.pc;
      if (a !== start) { start = a; ui.input.value = `$${hex4(start)}`; }
    }
    const s = `${start}|${machine.cpu.pc}|${rev}|${memRev}`;
    if (s === sig) return;
    sig = s;
    const names = machine.namesByAddr();
    const frag = document.createDocumentFragment();
    for (const ins of disassembleRange(read, start, LINES)) {
      if (names[ins.addr] !== undefined) frag.append(buildLabelRow(names[ins.addr]));
      frag.append(buildRow(machine, ins, ins.addr === machine.cpu.pc));
    }
    root.replaceChildren(frag);
  }

  goto(start);
  return { update, goto, refreshLabels: () => fillLabelSelect(ui.select, machine) };
}
