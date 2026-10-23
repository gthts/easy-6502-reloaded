// Ablaufansicht: aktive Instruktion hervorgehoben, davor und danach je bis zu 10 Instruktionen mit Marken.
// Bedienung: Klick auf eine Zeile = Haltepunkt; Doppelklick oder Ziehen der hervorgehobenen Zeile = Programmzähler dorthin;
// Eingabefeld/Markenliste + „PC setzen“ / „Haltepunkt“; Pfeiltasten verschieben den Programmzähler um eine Instruktion.
import { disassembleBefore, disassembleRange, disassembleOne, hex2, hex4 } from '../core/disassembler.js';
import { parseAddress } from '../core/search.js';
import { t } from '../i18n/index.js';

const CONTEXT = 10;

// Gemeinsam mit der Disassemblierung genutzt
export function buildRow(machine, ins, active) {
  const el = document.createElement('div');
  el.className = 'row' + (active ? ' active' : '');
  el.dataset.addr = String(ins.addr);
  if (active) el.draggable = true;
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
  if (ins.valid) {
    const mn = document.createElement('span');
    mn.className = 'mn';
    mn.dataset.mn = ins.mn;
    mn.title = t('ref.open');
    mn.textContent = ins.mn;
    txt.append(mn, ins.operand ? ` ${ins.operand}` : '', active ? '  ◂' : '');
  } else txt.textContent = ins.text + (active ? '  ◂' : '');
  el.append(bp, a, b, txt);
  return el;
}

export function buildLabelRow(name) {
  const el = document.createElement('div');
  el.className = 'lbl';
  el.textContent = `${name}:`;
  return el;
}

// Füllt ein Auswahlfeld mit den Marken (nach Adresse sortiert)
export function fillLabelSelect(select, machine) {
  select.replaceChildren();
  const first = document.createElement('option');
  first.value = '';
  first.textContent = t('flow.pickLabel');
  select.append(first);
  const entries = Object.entries(machine.labels).sort((x, y) => x[1] - y[1] || x[0].localeCompare(y[0]));
  for (const [name, addr] of entries) {
    const o = document.createElement('option');
    o.value = name;
    o.textContent = `${name}  $${hex4(addr)}`;
    select.append(o);
  }
}

export function createFlow(root, machine, { onToggleBp, onJump, ui }) {
  let sig = '';

  function target() {
    const addr = parseAddress(ui.input.value, machine.labels);
    if (addr === null) {
      ui.note.textContent = t('flow.badTarget', { text: ui.input.value.trim() });
      return null;
    }
    ui.note.textContent = '';
    return addr;
  }

  root.addEventListener('click', (e) => {
    const r = e.target.closest('.row');
    if (r) onToggleBp(Number(r.dataset.addr));
  });
  root.addEventListener('dblclick', (e) => {
    const r = e.target.closest('.row');
    if (r) onJump(Number(r.dataset.addr));
  });
  // Ziehen der hervorgehobenen Zeile auf eine andere Zeile
  root.addEventListener('dragstart', (e) => {
    if (!e.target.closest?.('.row.active')) { e.preventDefault(); return; }
    e.dataTransfer.setData('text/plain', 'pc');
    e.dataTransfer.effectAllowed = 'move';
  });
  root.addEventListener('dragover', (e) => {
    if (e.target.closest('.row')) e.preventDefault();
  });
  root.addEventListener('drop', (e) => {
    const r = e.target.closest('.row');
    if (!r) return;
    e.preventDefault();
    onJump(Number(r.dataset.addr));
  });

  ui.select.addEventListener('change', () => {
    if (ui.select.value) ui.input.value = ui.select.value;
  });
  ui.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const a = target(); if (a !== null) onJump(a); }
  });
  ui.jumpBtn.addEventListener('click', () => { const a = target(); if (a !== null) onJump(a); });
  ui.bpBtn.addEventListener('click', () => { const a = target(); if (a !== null) onToggleBp(a); });
  ui.prevBtn.addEventListener('click', () => {
    const known = new Set(machine.lineMap.map((l) => l.addr));
    for (const pc of machine.recentPcs()) known.add(pc);
    const before = disassembleBefore((a) => machine.mem.peek(a), machine.cpu.pc, 1, known);
    if (before.length) onJump(before[0].addr);
  });
  ui.nextBtn.addEventListener('click', () => {
    onJump(machine.cpu.pc + disassembleOne((a) => machine.mem.peek(a), machine.cpu.pc).size);
  });

  function update(rev, memRev) {
    const cpu = machine.cpu;
    const s = `${cpu.pc}|${machine.instructions}|${rev}|${memRev}`;
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
      if (names[ins.addr] !== undefined) frag.append(buildLabelRow(names[ins.addr]));
      frag.append(buildRow(machine, ins, active));
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
    // feste Höhe: die aktive Zeile in die Mitte rücken, statt das Feld wachsen oder schrumpfen zu lassen
    const act = root.querySelector('.row.active');
    if (act) root.scrollTop = Math.max(0, act.offsetTop - (root.clientHeight - act.offsetHeight) / 2);
  }

  return { update, refreshLabels: () => fillLabelSelect(ui.select, machine) };
}
