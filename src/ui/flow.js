// Ablaufansicht: aktive Instruktion hervorgehoben, davor und danach je bis zu 10 Instruktionen mit Marken.
import { disassembleBefore, disassembleRange, hex2, hex4 } from '../core/disassembler.js';

const CONTEXT = 10;

export function createFlow(root, machine, onBreakpointToggle) {
  let sig = '';

  function row(ins, active) {
    const el = document.createElement('div');
    el.className = 'row' + (active ? ' active' : '');
    el.dataset.addr = String(ins.addr);
    const bp = document.createElement('span');
    bp.className = 'bp';
    bp.textContent = machine.breakpoints.has(ins.addr) ? '●' : ' ';
    const a = document.createElement('span');
    a.className = 'a';
    a.textContent = `$${hex4(ins.addr)}`;
    const b = document.createElement('span');
    b.className = 'b';
    b.textContent = ins.bytes.map(hex2).join(' ');
    const txt = document.createElement('span');
    txt.textContent = ins.text + (active ? '  ◂' : '');
    el.append(bp, a, b, txt);
    return el;
  }

  function labelRow(name) {
    const el = document.createElement('div');
    el.className = 'lbl';
    el.textContent = `${name}:`;
    return el;
  }

  root.addEventListener('click', (e) => {
    const r = e.target.closest('.row');
    if (r) onBreakpointToggle(Number(r.dataset.addr));
  });

  function update(rev) {
    const cpu = machine.cpu;
    const s = `${cpu.pc}|${machine.instructions}|${rev}`;
    if (s === sig) return;
    sig = s;
    const read = (a) => machine.mem.peek(a);
    const names = machine.namesByAddr();
    const known = new Set(machine.lineMap.map((l) => l.addr));
    for (const pc of machine.recentPcs()) known.add(pc);
    const before = disassembleBefore(read, cpu.pc, CONTEXT, known, null);
    const after = disassembleRange(read, cpu.pc, CONTEXT + 1, null);
    const frag = document.createDocumentFragment();
    const push = (ins, active) => {
      if (names[ins.addr] !== undefined) frag.append(labelRow(names[ins.addr]));
      frag.append(row(ins, active));
    };
    for (let i = before.length; i < CONTEXT; i++) {
      const pad = document.createElement('div');
      pad.className = 'gap';
      pad.textContent = ' ';
      frag.append(pad);
    }
    before.forEach((i) => push(i, false));
    after.forEach((i, k) => push(i, k === 0));
    root.replaceChildren(frag);
  }

  return { update };
}
