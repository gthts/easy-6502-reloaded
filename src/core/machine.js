// Ablaufsteuerung: Speicher + CPU + Haltepunkte + Ablaufprotokoll.
// Die Maschine kennt weder Zeitgeber noch Anzeige. Wer sie treibt (Schleife, Einzelschritt),
// ruft run(budget) auf; Ansichten lesen den Zustand unabhängig davon.

import { Memory } from './memory.js';
import { CPU } from './cpu.js';
import { assemble, loadInto } from './assembler.js';
import { OPCODES } from './opcodes.js';

const HISTORY = 256;

export class Machine {
  constructor() {
    this.mem = new Memory();
    this.cpu = new CPU(this.mem);
    this.breakpoints = new Set();
    this.labels = {};
    this.lineMap = [];
    this.history = new Uint16Array(HISTORY); // Adressen zuletzt ausgeführter Instruktionen (Ringpuffer)
    this.historyLen = 0;
    this.historyPos = 0;
    this.stopReason = null; // 'breakpoint' | 'brk' | 'illegal' | null
    this.instructions = 0;
    this.entry = 0x0600;
  }

  // Assembliert und lädt in den Speicher. Der Speicher wird vorher gelöscht.
  assembleAndLoad(source, options) {
    const result = assemble(source, options);
    if (result.ok) {
      this.mem.clear();
      this.entry = loadInto(this.mem, result);
      this.labels = result.labels;
      this.lineMap = result.lineMap;
      this.reset();
    }
    return result;
  }

  reset() {
    this.cpu.reset(this.entry);
    this.historyLen = 0;
    this.historyPos = 0;
    this.stopReason = null;
    this.instructions = 0;
  }

  get running() {
    return !this.cpu.halted && this.stopReason === null;
  }

  // Namen der Marken nach Adresse (für Ablauf und Disassemblierung)
  namesByAddr() {
    const o = {};
    for (const [n, a] of Object.entries(this.labels)) if (o[a] === undefined) o[a] = n;
    return o;
  }

  recentPcs() {
    const out = [];
    for (let i = 0; i < this.historyLen; i++) {
      out.push(this.history[(this.historyPos - 1 - i + HISTORY * 2) % HISTORY]);
    }
    return out; // neueste zuerst
  }

  toggleBreakpoint(addr) {
    addr &= 0xffff;
    if (this.breakpoints.delete(addr)) return false;
    this.breakpoints.add(addr);
    return true;
  }

  // Führt eine Instruktion aus, ohne Haltepunkte zu prüfen. Liefert Takte.
  stepOnce() {
    const cpu = this.cpu;
    if (cpu.halted) return 0;
    this.history[this.historyPos] = cpu.pc;
    this.historyPos = (this.historyPos + 1) % HISTORY;
    if (this.historyLen < HISTORY) this.historyLen++;
    const c = cpu.step();
    if (cpu.halted) { this.stopReason = cpu.haltReason; return c; }
    this.instructions++;
    return c;
  }

  /**
   * Läuft höchstens `maxInstructions` Instruktionen oder bis ein Haltegrund eintritt.
   * Ein Haltepunkt gilt vor Ausführung der Instruktion an dieser Adresse; der erste Schritt
   * eines Laufs wird nie von einem Haltepunkt an der Startadresse verhindert.
   * @param {(m:Machine)=>boolean} [until]  zusätzliche Abbruchbedingung nach jeder Instruktion
   * @returns {'budget'|'breakpoint'|'brk'|'illegal'|'until'}
   */
  run(maxInstructions, until = null) {
    this.stopReason = null;
    const cpu = this.cpu;
    const bps = this.breakpoints;
    let first = true;
    for (let i = 0; i < maxInstructions; i++) {
      if (!first && bps.size && bps.has(cpu.pc)) { this.stopReason = 'breakpoint'; return 'breakpoint'; }
      first = false;
      this.stepOnce();
      if (cpu.halted) return this.stopReason;
      if (until && until(this)) return 'until';
    }
    return 'budget';
  }

  // Ein Einzelschritt (Schritt hinein)
  stepInto() {
    this.stopReason = null;
    return this.run(1);
  }

  // Schritt über: ein JSR wird als Ganzes ausgeführt
  stepOver(limit = 5_000_000) {
    const cpu = this.cpu;
    const info = OPCODES[this.mem.peek(cpu.pc)];
    if (!info || info.mn !== 'JSR') return this.stepInto();
    const ret = (cpu.pc + 3) & 0xffff;
    const sp = cpu.sp;
    this.stepOnce();
    return this.run(limit, (m) => m.cpu.pc === ret && m.cpu.sp === sp);
  }

  // Schritt hinaus: bis zum RTS/RTI, das den aktuellen Stapelstand verlässt
  stepOut(limit = 5_000_000) {
    const cpu = this.cpu;
    const sp = cpu.sp;
    let seenReturn = false;
    return this.run(limit, (m) => {
      const prev = OPCODES[m.mem.peek(m.recentPcs()[0])];
      if (prev && (prev.mn === 'RTS' || prev.mn === 'RTI') && m.cpu.sp > sp) seenReturn = true;
      return seenReturn;
    });
  }
}
