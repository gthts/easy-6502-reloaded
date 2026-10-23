// Sprachneutrale Angaben zu den Befehlen: Gruppe, beeinflusste Flags, Wirkung in Kurzschrift, passendes Lehrbuchkapitel.
// Die Texte (Namen, Beschreibungen) stehen je Sprache in content/<sprache>/reference.json.
//
// Flags: N V - B D I Z C. Ein Buchstabe heißt „wird je nach Ergebnis gesetzt oder gelöscht“.
// Zeichen „0“ oder „1“ nach dem Buchstaben heißt „wird fest auf 0/1 gesetzt“ (z. B. C0 bei CLC).
// M = Operand (Zahl oder Speicherzelle), PC = Programmzähler, SP = Stapelzeiger, P = Statusregister.

export const CATEGORIES = ['load', 'transfer', 'stack', 'arith', 'logic', 'shift', 'count', 'compare', 'branch', 'jump', 'flag', 'other'];

const CHAPTER_OF = {
  load: 'register', transfer: 'register', stack: 'stapel', arith: 'rechnen', logic: 'bits', shift: 'bits',
  count: 'register', compare: 'verzweigen', branch: 'verzweigen', jump: 'spruenge', flag: 'rechnen', other: 'register',
};
const CHAPTER_OVERRIDE = { LDA: 'erstes-programm', STA: 'erstes-programm', INC: 'schleifen', DEC: 'schleifen', JMP: 'spruenge', NOP: 'spruenge', BRK: 'register' };

const M = (cat, flags, op) => ({ cat, flags, op });

export const META = {
  LDA: M('load', 'NZ', 'A ← M'), LDX: M('load', 'NZ', 'X ← M'), LDY: M('load', 'NZ', 'Y ← M'),
  STA: M('load', '', 'M ← A'), STX: M('load', '', 'M ← X'), STY: M('load', '', 'M ← Y'),
  TAX: M('transfer', 'NZ', 'X ← A'), TAY: M('transfer', 'NZ', 'Y ← A'), TXA: M('transfer', 'NZ', 'A ← X'),
  TYA: M('transfer', 'NZ', 'A ← Y'), TSX: M('transfer', 'NZ', 'X ← SP'), TXS: M('transfer', '', 'SP ← X'),
  PHA: M('stack', '', 'push A'), PLA: M('stack', 'NZ', 'A ← pull'), PHP: M('stack', '', 'push P'), PLP: M('stack', 'NVDIZC', 'P ← pull'),
  ADC: M('arith', 'NVZC', 'A ← A + M + C'), SBC: M('arith', 'NVZC', 'A ← A − M − (1 − C)'),
  AND: M('logic', 'NZ', 'A ← A ∧ M'), ORA: M('logic', 'NZ', 'A ← A ∨ M'), EOR: M('logic', 'NZ', 'A ← A ⊕ M'), BIT: M('logic', 'NVZ', 'Z ← (A ∧ M) = 0;  N ← M₇;  V ← M₆'),
  ASL: M('shift', 'NZC', 'C ← [7…0] ← 0'), LSR: M('shift', 'NZC', '0 → [7…0] → C'),
  ROL: M('shift', 'NZC', 'C ← [7…0] ← C'), ROR: M('shift', 'NZC', 'C → [7…0] → C'),
  INC: M('count', 'NZ', 'M ← M + 1'), DEC: M('count', 'NZ', 'M ← M − 1'),
  INX: M('count', 'NZ', 'X ← X + 1'), INY: M('count', 'NZ', 'Y ← Y + 1'), DEX: M('count', 'NZ', 'X ← X − 1'), DEY: M('count', 'NZ', 'Y ← Y − 1'),
  CMP: M('compare', 'NZC', 'A − M (nur Flags)'), CPX: M('compare', 'NZC', 'X − M (nur Flags)'), CPY: M('compare', 'NZC', 'Y − M (nur Flags)'),
  BCC: M('branch', '', 'C = 0 ⇒ PC ← Ziel'), BCS: M('branch', '', 'C = 1 ⇒ PC ← Ziel'),
  BEQ: M('branch', '', 'Z = 1 ⇒ PC ← Ziel'), BNE: M('branch', '', 'Z = 0 ⇒ PC ← Ziel'),
  BMI: M('branch', '', 'N = 1 ⇒ PC ← Ziel'), BPL: M('branch', '', 'N = 0 ⇒ PC ← Ziel'),
  BVC: M('branch', '', 'V = 0 ⇒ PC ← Ziel'), BVS: M('branch', '', 'V = 1 ⇒ PC ← Ziel'),
  JMP: M('jump', '', 'PC ← Ziel'), JSR: M('jump', '', 'push PC+2;  PC ← Ziel'), RTS: M('jump', '', 'PC ← pull + 1'),
  RTI: M('jump', 'NVDIZC', 'P ← pull;  PC ← pull'), BRK: M('other', 'I1', 'push PC+2, P;  PC ← ($FFFE)'), NOP: M('other', '', '–'),
  CLC: M('flag', 'C0', 'C ← 0'), CLD: M('flag', 'D0', 'D ← 0'), CLI: M('flag', 'I0', 'I ← 0'), CLV: M('flag', 'V0', 'V ← 0'),
  SEC: M('flag', 'C1', 'C ← 1'), SED: M('flag', 'D1', 'D ← 1'), SEI: M('flag', 'I1', 'I ← 1'),
};

export function chapterFor(mn) {
  return CHAPTER_OVERRIDE[mn] ?? CHAPTER_OF[META[mn].cat];
}

// Schreibweise und Beispiel je Adressierungsart (sprachneutral)
export const MODE_INFO = {
  imp: { notation: '–', example: 'INX', chapter: 'adressierung-1' },
  acc: { notation: 'A', example: 'ASL A', chapter: 'adressierung-1' },
  imm: { notation: '#$nn', example: 'LDA #$05', chapter: 'adressierung-1' },
  zp: { notation: '$nn', example: 'LDA $05', chapter: 'adressierung-1' },
  zpx: { notation: '$nn,X', example: 'LDA $05,X', chapter: 'adressierung-2' },
  zpy: { notation: '$nn,Y', example: 'LDX $05,Y', chapter: 'adressierung-2' },
  abs: { notation: '$nnnn', example: 'LDA $0205', chapter: 'adressierung-1' },
  abx: { notation: '$nnnn,X', example: 'LDA $0205,X', chapter: 'adressierung-2' },
  aby: { notation: '$nnnn,Y', example: 'LDA $0205,Y', chapter: 'adressierung-2' },
  ind: { notation: '($nnnn)', example: 'JMP ($00F0)', chapter: 'zeiger-1' },
  izx: { notation: '($nn,X)', example: 'LDA ($05,X)', chapter: 'zeiger-2' },
  izy: { notation: '($nn),Y', example: 'LDA ($05),Y', chapter: 'zeiger-1' },
  rel: { notation: 'Marke', example: 'BNE schleife', chapter: 'verzweigen' },
};

export const MODE_ORDER = ['imp', 'acc', 'imm', 'zp', 'zpx', 'zpy', 'abs', 'abx', 'aby', 'ind', 'izx', 'izy', 'rel'];

export const FLAG_ORDER = ['N', 'V', '-', 'B', 'D', 'I', 'Z', 'C'];

// Einzelne Flags, die ein Befehl beeinflusst: [{ flag: 'N', fixed: null | 0 | 1 }]
export function flagEffects(flags) {
  const out = [];
  for (let i = 0; i < flags.length; i++) {
    const f = flags[i];
    const next = flags[i + 1];
    if (next === '0' || next === '1') { out.push({ flag: f, fixed: Number(next) }); i++; } else out.push({ flag: f, fixed: null });
  }
  return out;
}
