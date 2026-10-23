// Befehlstabelle des MOS 6502 (151 offizielle Opcodes).
// Quelle der Opcode-Werte: Dokumentation von John Pickens, Bruce Clark und Ed Spittles (6502.org).

// Adressierungsarten: Bytelänge inklusive Opcode
// Anzeigenamen stehen im Katalog unter „mode.<kürzel>“ (src/i18n)
export const MODES = {
  imp: { size: 1 },
  acc: { size: 1 },
  imm: { size: 2 },
  zp:  { size: 2 },
  zpx: { size: 2 },
  zpy: { size: 2 },
  abs: { size: 3 },
  abx: { size: 3 },
  aby: { size: 3 },
  ind: { size: 3 },
  izx: { size: 2 },
  izy: { size: 2 },
  rel: { size: 2 },
};

// Mnemonik -> { Adressierungsart: Opcode }
const TABLE = {
  ADC: { imm: 0x69, zp: 0x65, zpx: 0x75, abs: 0x6d, abx: 0x7d, aby: 0x79, izx: 0x61, izy: 0x71 },
  AND: { imm: 0x29, zp: 0x25, zpx: 0x35, abs: 0x2d, abx: 0x3d, aby: 0x39, izx: 0x21, izy: 0x31 },
  ASL: { acc: 0x0a, zp: 0x06, zpx: 0x16, abs: 0x0e, abx: 0x1e },
  BCC: { rel: 0x90 }, BCS: { rel: 0xb0 }, BEQ: { rel: 0xf0 }, BMI: { rel: 0x30 },
  BNE: { rel: 0xd0 }, BPL: { rel: 0x10 }, BVC: { rel: 0x50 }, BVS: { rel: 0x70 },
  BIT: { zp: 0x24, abs: 0x2c },
  BRK: { imp: 0x00 },
  CLC: { imp: 0x18 }, CLD: { imp: 0xd8 }, CLI: { imp: 0x58 }, CLV: { imp: 0xb8 },
  CMP: { imm: 0xc9, zp: 0xc5, zpx: 0xd5, abs: 0xcd, abx: 0xdd, aby: 0xd9, izx: 0xc1, izy: 0xd1 },
  CPX: { imm: 0xe0, zp: 0xe4, abs: 0xec },
  CPY: { imm: 0xc0, zp: 0xc4, abs: 0xcc },
  DEC: { zp: 0xc6, zpx: 0xd6, abs: 0xce, abx: 0xde },
  DEX: { imp: 0xca }, DEY: { imp: 0x88 },
  EOR: { imm: 0x49, zp: 0x45, zpx: 0x55, abs: 0x4d, abx: 0x5d, aby: 0x59, izx: 0x41, izy: 0x51 },
  INC: { zp: 0xe6, zpx: 0xf6, abs: 0xee, abx: 0xfe },
  INX: { imp: 0xe8 }, INY: { imp: 0xc8 },
  JMP: { abs: 0x4c, ind: 0x6c },
  JSR: { abs: 0x20 },
  LDA: { imm: 0xa9, zp: 0xa5, zpx: 0xb5, abs: 0xad, abx: 0xbd, aby: 0xb9, izx: 0xa1, izy: 0xb1 },
  LDX: { imm: 0xa2, zp: 0xa6, zpy: 0xb6, abs: 0xae, aby: 0xbe },
  LDY: { imm: 0xa0, zp: 0xa4, zpx: 0xb4, abs: 0xac, abx: 0xbc },
  LSR: { acc: 0x4a, zp: 0x46, zpx: 0x56, abs: 0x4e, abx: 0x5e },
  NOP: { imp: 0xea },
  ORA: { imm: 0x09, zp: 0x05, zpx: 0x15, abs: 0x0d, abx: 0x1d, aby: 0x19, izx: 0x01, izy: 0x11 },
  PHA: { imp: 0x48 }, PHP: { imp: 0x08 }, PLA: { imp: 0x68 }, PLP: { imp: 0x28 },
  ROL: { acc: 0x2a, zp: 0x26, zpx: 0x36, abs: 0x2e, abx: 0x3e },
  ROR: { acc: 0x6a, zp: 0x66, zpx: 0x76, abs: 0x6e, abx: 0x7e },
  RTI: { imp: 0x40 }, RTS: { imp: 0x60 },
  SBC: { imm: 0xe9, zp: 0xe5, zpx: 0xf5, abs: 0xed, abx: 0xfd, aby: 0xf9, izx: 0xe1, izy: 0xf1 },
  SEC: { imp: 0x38 }, SED: { imp: 0xf8 }, SEI: { imp: 0x78 },
  STA: { zp: 0x85, zpx: 0x95, abs: 0x8d, abx: 0x9d, aby: 0x99, izx: 0x81, izy: 0x91 },
  STX: { zp: 0x86, zpy: 0x96, abs: 0x8e },
  STY: { zp: 0x84, zpx: 0x94, abs: 0x8c },
  TAX: { imp: 0xaa }, TAY: { imp: 0xa8 }, TSX: { imp: 0xba },
  TXA: { imp: 0x8a }, TXS: { imp: 0x9a }, TYA: { imp: 0x98 },
};

// Grundtakte je Adressierungsart (lesende Befehle)
const READ_CYCLES = { imm: 2, zp: 3, zpx: 4, zpy: 4, abs: 4, abx: 4, aby: 4, izx: 6, izy: 5 };
const RMW_CYCLES = { acc: 2, zp: 5, zpx: 6, abs: 6, abx: 7 };
const STORE_CYCLES = { zp: 3, zpx: 4, zpy: 4, abs: 4, abx: 5, aby: 5, izx: 6, izy: 6 };
const RMW = new Set(['ASL', 'LSR', 'ROL', 'ROR', 'INC', 'DEC']);
const STORE = new Set(['STA', 'STX', 'STY']);
const FIXED = { BRK: 7, JSR: 6, RTS: 6, RTI: 6, PHA: 3, PHP: 3, PLA: 4, PLP: 4 };

function baseCycles(mn, mode) {
  if (mn in FIXED) return FIXED[mn];
  if (mn === 'JMP') return mode === 'abs' ? 3 : 5;
  if (mode === 'rel') return 2;
  if (mode === 'imp') return 2;
  if (RMW.has(mn)) return RMW_CYCLES[mode];
  if (STORE.has(mn)) return STORE_CYCLES[mode];
  return READ_CYCLES[mode];
}

export const BRANCHES = new Set(['BCC', 'BCS', 'BEQ', 'BMI', 'BNE', 'BPL', 'BVC', 'BVS']);

// OPCODES[opcode] = { mn, mode, size, cycles, pageCross } oder undefined (nicht belegt)
export const OPCODES = new Array(256);
// BY_MNEMONIC[mn][mode] = Opcode
export const BY_MNEMONIC = TABLE;

for (const [mn, modes] of Object.entries(TABLE)) {
  for (const [mode, op] of Object.entries(modes)) {
    OPCODES[op] = {
      op,
      mn,
      mode,
      size: MODES[mode].size,
      cycles: baseCycles(mn, mode),
      // +1 Takt beim Überschreiten einer Seitengrenze (nur lesende Befehle)
      pageCross: !RMW.has(mn) && !STORE.has(mn) && (mode === 'abx' || mode === 'aby' || mode === 'izy'),
    };
  }
}

export const MNEMONICS = new Set(Object.keys(TABLE));
