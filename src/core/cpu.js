// MOS 6502 (NMOS), offizielle Befehle, mit Dezimalmodus.

import { OPCODES } from './opcodes.js';

export class CPU {
  constructor(memory) {
    this.mem = memory;
    // Wenn wahr, hält BRK die CPU an (wie in den Lernumgebungen üblich), statt den Interrupt auszulösen.
    this.stopOnBrk = true;
    this.reset();
  }

  reset(pc = 0x0600) {
    this.a = 0;
    this.x = 0;
    this.y = 0;
    this.sp = 0xff;
    this.pc = pc & 0xffff;
    this.c = 0; this.z = 0; this.i = 1; this.d = 0; this.v = 0; this.n = 0;
    this.cycles = 0;
    this.halted = false;
    this.haltReason = null; // 'brk' | 'illegal'
  }

  get p() {
    return this.c | (this.z << 1) | (this.i << 2) | (this.d << 3) | 0x20 | (this.v << 6) | (this.n << 7);
  }

  set p(v) {
    this.c = v & 1;
    this.z = (v >> 1) & 1;
    this.i = (v >> 2) & 1;
    this.d = (v >> 3) & 1;
    this.v = (v >> 6) & 1;
    this.n = (v >> 7) & 1;
  }

  push(v) {
    this.mem.write(0x100 + this.sp, v);
    this.sp = (this.sp - 1) & 0xff;
  }

  pull() {
    this.sp = (this.sp + 1) & 0xff;
    return this.mem.read(0x100 + this.sp);
  }

  nz(v) {
    this.z = v === 0 ? 1 : 0;
    this.n = v >> 7;
    return v;
  }

  // Adresse des Operanden bestimmen; setzt this.crossed bei Seitenüberschreitung
  address(mode) {
    const m = this.mem;
    let pc = this.pc;
    let a;
    this.crossed = false;
    switch (mode) {
      case 'imm': a = pc; this.pc = (pc + 1) & 0xffff; return a;
      case 'zp': a = m.read(pc); this.pc = (pc + 1) & 0xffff; return a;
      case 'zpx': a = (m.read(pc) + this.x) & 0xff; this.pc = (pc + 1) & 0xffff; return a;
      case 'zpy': a = (m.read(pc) + this.y) & 0xff; this.pc = (pc + 1) & 0xffff; return a;
      case 'abs': a = m.read(pc) | (m.read((pc + 1) & 0xffff) << 8); this.pc = (pc + 2) & 0xffff; return a;
      case 'abx': {
        const b = m.read(pc) | (m.read((pc + 1) & 0xffff) << 8);
        this.pc = (pc + 2) & 0xffff;
        a = (b + this.x) & 0xffff;
        this.crossed = (a & 0xff00) !== (b & 0xff00);
        return a;
      }
      case 'aby': {
        const b = m.read(pc) | (m.read((pc + 1) & 0xffff) << 8);
        this.pc = (pc + 2) & 0xffff;
        a = (b + this.y) & 0xffff;
        this.crossed = (a & 0xff00) !== (b & 0xff00);
        return a;
      }
      case 'izx': {
        const z = (m.read(pc) + this.x) & 0xff;
        this.pc = (pc + 1) & 0xffff;
        return m.read(z) | (m.read((z + 1) & 0xff) << 8);
      }
      case 'izy': {
        const z = m.read(pc);
        this.pc = (pc + 1) & 0xffff;
        const b = m.read(z) | (m.read((z + 1) & 0xff) << 8);
        a = (b + this.y) & 0xffff;
        this.crossed = (a & 0xff00) !== (b & 0xff00);
        return a;
      }
      case 'ind': {
        const p = m.read(pc) | (m.read((pc + 1) & 0xffff) << 8);
        this.pc = (pc + 2) & 0xffff;
        // Fehler des NMOS-6502: der Überlauf der Low-Byte-Adresse wird nicht in die Seite übertragen
        return m.read(p) | (m.read((p & 0xff00) | ((p + 1) & 0xff)) << 8);
      }
      default:
        return 0;
    }
  }

  adc(m) {
    const a = this.a;
    if (this.d) {
      let al = (a & 0x0f) + (m & 0x0f) + this.c;
      if (al >= 0x0a) al = ((al + 0x06) & 0x0f) + 0x10;
      let s = (a & 0xf0) + (m & 0xf0) + al;
      const bin = a + m + this.c;
      this.z = (bin & 0xff) === 0 ? 1 : 0;
      this.n = (s >> 7) & 1;
      this.v = (~(a ^ m) & (a ^ s) & 0x80) ? 1 : 0;
      if (s >= 0xa0) s += 0x60;
      this.c = s >= 0x100 ? 1 : 0;
      this.a = s & 0xff;
    } else {
      const s = a + m + this.c;
      this.v = (~(a ^ m) & (a ^ s) & 0x80) ? 1 : 0;
      this.c = s > 0xff ? 1 : 0;
      this.a = this.nz(s & 0xff);
    }
  }

  compare(r, m) {
    const t = r - m;
    this.c = t >= 0 ? 1 : 0;
    this.nz(t & 0xff);
  }

  // Führt einen Befehl aus und liefert die verbrauchten Takte.
  // Bei unbekanntem Opcode oder (mit stopOnBrk) BRK bleibt die CPU stehen.
  step() {
    if (this.halted) return 0;
    const m = this.mem;
    const startPc = this.pc;
    const opc = m.read(startPc);
    const info = OPCODES[opc];
    if (info === undefined) {
      this.halted = true;
      this.haltReason = 'illegal';
      return 0;
    }
    this.pc = (startPc + 1) & 0xffff;
    const mn = info.mn;
    const mode = info.mode;
    let cyc = info.cycles;
    let ea = 0;
    let val = 0;

    if (mode !== 'imp' && mode !== 'acc' && mode !== 'rel') {
      ea = this.address(mode);
      if (this.crossed && info.pageCross) cyc++;
    }

    switch (mn) {
      case 'LDA': this.a = this.nz(m.read(ea)); break;
      case 'LDX': this.x = this.nz(m.read(ea)); break;
      case 'LDY': this.y = this.nz(m.read(ea)); break;
      case 'STA': m.write(ea, this.a); break;
      case 'STX': m.write(ea, this.x); break;
      case 'STY': m.write(ea, this.y); break;
      case 'TAX': this.x = this.nz(this.a); break;
      case 'TAY': this.y = this.nz(this.a); break;
      case 'TXA': this.a = this.nz(this.x); break;
      case 'TYA': this.a = this.nz(this.y); break;
      case 'TSX': this.x = this.nz(this.sp); break;
      case 'TXS': this.sp = this.x; break;
      case 'PHA': this.push(this.a); break;
      case 'PHP': this.push(this.p | 0x10); break;
      case 'PLA': this.a = this.nz(this.pull()); break;
      case 'PLP': this.p = this.pull(); break;
      case 'AND': this.a = this.nz(this.a & m.read(ea)); break;
      case 'ORA': this.a = this.nz(this.a | m.read(ea)); break;
      case 'EOR': this.a = this.nz(this.a ^ m.read(ea)); break;
      case 'ADC': this.adc(m.read(ea)); break;
      case 'SBC': this.sbc(m.read(ea)); break;
      case 'CMP': this.compare(this.a, m.read(ea)); break;
      case 'CPX': this.compare(this.x, m.read(ea)); break;
      case 'CPY': this.compare(this.y, m.read(ea)); break;
      case 'BIT':
        val = m.read(ea);
        this.z = (this.a & val) === 0 ? 1 : 0;
        this.n = val >> 7;
        this.v = (val >> 6) & 1;
        break;
      case 'INC': m.write(ea, this.nz((m.read(ea) + 1) & 0xff)); break;
      case 'DEC': m.write(ea, this.nz((m.read(ea) - 1) & 0xff)); break;
      case 'INX': this.x = this.nz((this.x + 1) & 0xff); break;
      case 'INY': this.y = this.nz((this.y + 1) & 0xff); break;
      case 'DEX': this.x = this.nz((this.x - 1) & 0xff); break;
      case 'DEY': this.y = this.nz((this.y - 1) & 0xff); break;
      case 'ASL': case 'LSR': case 'ROL': case 'ROR': {
        val = mode === 'acc' ? this.a : m.read(ea);
        let r;
        if (mn === 'ASL') { this.c = val >> 7; r = (val << 1) & 0xff; }
        else if (mn === 'LSR') { this.c = val & 1; r = val >> 1; }
        else if (mn === 'ROL') { r = ((val << 1) | this.c) & 0xff; this.c = val >> 7; }
        else { r = (val >> 1) | (this.c << 7); this.c = val & 1; }
        this.nz(r);
        if (mode === 'acc') this.a = r; else m.write(ea, r);
        break;
      }
      case 'JMP': this.pc = ea; break;
      case 'JSR': {
        const ret = (this.pc - 1) & 0xffff;
        this.push(ret >> 8);
        this.push(ret & 0xff);
        this.pc = ea;
        break;
      }
      case 'RTS': {
        const lo = this.pull();
        const hi = this.pull();
        this.pc = (((hi << 8) | lo) + 1) & 0xffff;
        break;
      }
      case 'RTI': {
        this.p = this.pull();
        const lo = this.pull();
        const hi = this.pull();
        this.pc = (hi << 8) | lo;
        break;
      }
      case 'BRK':
        if (this.stopOnBrk) {
          this.halted = true;
          this.haltReason = 'brk';
        } else {
          const ret = (this.pc + 1) & 0xffff;
          this.push(ret >> 8);
          this.push(ret & 0xff);
          this.push(this.p | 0x10);
          this.i = 1;
          this.pc = m.read(0xfffe) | (m.read(0xffff) << 8);
        }
        break;
      case 'CLC': this.c = 0; break;
      case 'SEC': this.c = 1; break;
      case 'CLD': this.d = 0; break;
      case 'SED': this.d = 1; break;
      case 'CLI': this.i = 0; break;
      case 'SEI': this.i = 1; break;
      case 'CLV': this.v = 0; break;
      case 'NOP': break;
      case 'BCC': cyc += this.branch(!this.c); break;
      case 'BCS': cyc += this.branch(this.c); break;
      case 'BEQ': cyc += this.branch(this.z); break;
      case 'BNE': cyc += this.branch(!this.z); break;
      case 'BMI': cyc += this.branch(this.n); break;
      case 'BPL': cyc += this.branch(!this.n); break;
      case 'BVS': cyc += this.branch(this.v); break;
      case 'BVC': cyc += this.branch(!this.v); break;
    }
    this.cycles += cyc;
    return cyc;
  }

  sbc(m) {
    const a = this.a;
    if (this.d) {
      // Dezimalmodus (NMOS): Flags wie im Binärmodus, Ergebnis dezimal korrigiert
      const bin = a - m - (1 - this.c);
      this.v = ((a ^ m) & (a ^ bin) & 0x80) ? 1 : 0;
      const carry = bin >= 0 ? 1 : 0;
      this.nz(bin & 0xff);
      let al = (a & 0x0f) - (m & 0x0f) + this.c - 1;
      if (al < 0) al = ((al - 0x06) & 0x0f) - 0x10;
      let s = (a & 0xf0) - (m & 0xf0) + al;
      if (s < 0) s -= 0x60;
      this.c = carry;
      this.a = s & 0xff;
      return;
    }
    // Binär: SBC ist ADC mit invertiertem Operanden
    const inv = m ^ 0xff;
    const s = a + inv + this.c;
    this.v = (~(a ^ inv) & (a ^ s) & 0x80) ? 1 : 0;
    this.c = s > 0xff ? 1 : 0;
    this.a = this.nz(s & 0xff);
  }

  branch(cond) {
    const off = this.mem.read(this.pc);
    this.pc = (this.pc + 1) & 0xffff;
    if (!cond) return 0;
    const target = (this.pc + (off < 0x80 ? off : off - 0x100)) & 0xffff;
    const extra = (target & 0xff00) !== (this.pc & 0xff00) ? 2 : 1;
    this.pc = target;
    return extra;
  }
}
