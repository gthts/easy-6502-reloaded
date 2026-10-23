import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { OPCODES, BY_MNEMONIC } from '../src/core/opcodes.js';
import { assemble } from '../src/core/assembler.js';
import { disassembleOne, disassembleBefore } from '../src/core/disassembler.js';
import { Machine } from '../src/core/machine.js';
import { setLocale, t } from '../src/i18n/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function run(source, maxInstructions = 100000) {
  const m = new Machine();
  const r = m.assembleAndLoad(source);
  assert.ok(r.ok, JSON.stringify(r.errors));
  m.run(maxInstructions);
  return m;
}

test('151 offizielle Opcodes sind belegt', () => {
  assert.equal(OPCODES.filter(Boolean).length, 151);
});

test('Assembler und Disassembler sind zueinander stimmig (alle Opcodes)', () => {
  const sample = { imm: '#$12', zp: '$12', zpx: '$12,X', zpy: '$12,Y', abs: '$1234', abx: '$1234,X', aby: '$1234,Y',
    ind: '($1234)', izx: '($12,X)', izy: '($12),Y', rel: '$0610', acc: 'A', imp: '' };
  for (const [mn, modes] of Object.entries(BY_MNEMONIC)) {
    for (const [mode, op] of Object.entries(modes)) {
      const src = `*=$0600\n${mn} ${sample[mode]}`;
      const r = assemble(src);
      assert.ok(r.ok, `${mn} ${mode}: ${JSON.stringify(r.errors)}`);
      assert.equal(r.segments[0].bytes[0], op, `${mn} ${mode}`);
      const bytes = r.segments[0].bytes;
      const d = disassembleOne((a) => bytes[a - 0x600] ?? 0, 0x600);
      assert.equal(d.mn, mn);
      assert.equal(d.size, bytes.length);
    }
  }
});

test('Zahlen, Konstanten, Ausdrücke, Daten', () => {
  const r = assemble(`
    define zeiger $10
    wert = 3 * 4 + 1
    *= $0700
    start: lda #<ziel
    ldx #>ziel
    lda #wert
    sta zeiger
    dcb 1, $2, %11, 'a', "hi"
    dcw ziel
    ziel: nop`);
  assert.ok(r.ok, JSON.stringify(r.errors));
  const bytes = r.segments[0].bytes;
  assert.equal(r.segments[0].addr, 0x700);
  // A9 lo, A2 hi, A9 0D, 85 10
  assert.deepEqual(bytes.slice(0, 8), [0xa9, r.labels.ziel & 0xff, 0xa2, r.labels.ziel >> 8, 0xa9, 13, 0x85, 0x10]);
  assert.deepEqual(bytes.slice(8, 14), [1, 2, 3, 97, 104, 105]);
});

test('Vorwärtsmarke ergibt absolute Adressierung, rückwärts bekannte Nullseitenmarke Nullseite', () => {
  const r = assemble(`
    lda vorn
    zp = $20
    lda zp
    vorn: nop`);
  assert.ok(r.ok);
  assert.equal(r.segments[0].bytes[0], 0xad); // LDA abs
  assert.equal(r.segments[0].bytes[3], 0xa5); // LDA zp
});

test('Fehler tragen Zeile, Schlüssel und lassen sich übersetzen', () => {
  const r = assemble('nop\nfoo\nlda #300\nbne weit\nlda undefiniert');
  assert.equal(r.ok, false);
  const keys = r.errors.map((e) => `${e.line}:${e.key}`);
  assert.ok(keys.includes('2:asm.unknownCmd'), keys.join());
  assert.ok(keys.includes('3:asm.byteRange'), keys.join());
  assert.ok(keys.includes('4:asm.unknownSymbol'), keys.join());
  assert.equal(t('asm.unknownCmd', { name: 'foo' }, 'en'), 'Unknown instruction or directive: foo');
  assert.equal(t('asm.unknownCmd', { name: 'foo' }, 'de'), 'Unbekannter Befehl oder unbekannte Anweisung: foo');
  assert.equal(t('asm.modeUnsupported', { mn: 'STA', mode: { t: 'mode.imm' } }, 'de'), 'STA kennt die Adressierungsart „unmittelbar“ nicht');
  setLocale('de');
  assert.match(assemble('foo').errors[0].message, /Unbekannter Befehl/);
  setLocale('en');
});

test('Verzweigung zu weit entfernt', () => {
  const r = assemble(`start: nop\n*=$0700\nbne start`);
  assert.equal(r.errors[0].key, 'asm.branchFar');
});

test('Schleife, Flags und Speicher', () => {
  const m = run(`
    ldx #0
    loop: inx
    stx $0200
    cpx #10
    bne loop
    brk`);
  assert.equal(m.mem.peek(0x200), 10);
  assert.equal(m.cpu.x, 10);
  assert.equal(m.cpu.z, 1);
  assert.equal(m.stopReason, 'brk');
});

test('Unterprogramm, Stapel', () => {
  const m = run(`
    lda #5
    jsr doppelt
    sta $10
    brk
    doppelt: asl
    rts`);
  assert.equal(m.mem.peek(0x10), 10);
  assert.equal(m.cpu.sp, 0xff);
});

test('ADC/SBC binär: Übertrag und Überlauf', () => {
  let m = run('clc\nlda #$f0\nadc #$20\nbrk');
  assert.equal(m.cpu.a, 0x10);
  assert.equal(m.cpu.c, 1);
  m = run('clc\nlda #$50\nadc #$50\nbrk');
  assert.equal(m.cpu.a, 0xa0);
  assert.equal(m.cpu.v, 1);
  assert.equal(m.cpu.n, 1);
  m = run('sec\nlda #$10\nsbc #$20\nbrk');
  assert.equal(m.cpu.a, 0xf0);
  assert.equal(m.cpu.c, 0);
});

test('Dezimalmodus', () => {
  let m = run('sed\nclc\nlda #$19\nadc #$28\nbrk');
  assert.equal(m.cpu.a, 0x47);
  m = run('sed\nsec\nlda #$50\nsbc #$01\nbrk');
  assert.equal(m.cpu.a, 0x49);
});

test('Indirekt indiziert und indiziert indirekt', () => {
  const m = run(`
    lda #$00
    sta $20
    lda #$03
    sta $21
    lda #$77
    ldy #4
    sta ($20),y
    ldx #0
    lda #$40
    sta $30
    lda #$03
    sta $31
    lda #$99
    sta ($30,x)
    brk`);
  assert.equal(m.mem.peek(0x304), 0x77);
  assert.equal(m.mem.peek(0x340), 0x99);
});

test('JMP indirekt: Seitenfehler des NMOS-6502', () => {
  const m = new Machine();
  m.mem.load(0x600, [0x6c, 0xff, 0x02]); // JMP ($02FF)
  m.mem.poke(0x2ff, 0x34);
  m.mem.poke(0x300, 0x99); // wird nicht gelesen
  m.mem.poke(0x200, 0x12);
  m.reset();
  m.stepOnce();
  assert.equal(m.cpu.pc, 0x1234);
});

test('Takte inklusive Seitenüberschreitung', () => {
  const m = new Machine();
  m.mem.load(0x600, [0xbd, 0xff, 0x02, 0xbd, 0x00, 0x03]); // LDA $02FF,X (X=1 → Seitenwechsel)
  m.reset();
  m.cpu.x = 1;
  assert.equal(m.stepOnce(), 5);
  m.cpu.x = 1;
  assert.equal(m.stepOnce(), 4);
});

test('Haltepunkte, Schritt über, Schritt hinaus', () => {
  const m = new Machine();
  const r = m.assembleAndLoad(`
    jsr sub
    ldx #1
    ldx #2
    brk
    sub: ldy #7
    iny
    rts`);
  assert.ok(r.ok);
  m.stepOver();
  assert.equal(m.cpu.pc, 0x603);
  m.reset();
  m.toggleBreakpoint(r.labels.sub + 2);
  assert.equal(m.run(1000), 'breakpoint');
  assert.equal(m.cpu.pc, r.labels.sub + 2);
  assert.equal(m.run(1000), 'brk'); // erster Schritt ignoriert den Haltepunkt an der Startadresse
  m.reset();
  m.breakpoints.clear();
  m.run(1); // JSR
  m.stepOut();
  assert.equal(m.cpu.pc, 0x603);
});

test('Rückwärts-Disassemblierung trifft die Ausrichtung', () => {
  const m = new Machine();
  m.assembleAndLoad('lda #1\nsta $10\nldx $1234\ninx\nnop\nbrk');
  const before = disassembleBefore((a) => m.mem.peek(a), 0x600 + 8, 3);
  assert.deepEqual(before.map((i) => i.mn), ['STA', 'LDX', 'INX'].slice(0, before.length));
});

test('Alle Beispielprogramme lassen sich übersetzen', () => {
  const dir = path.join(here, '..', 'examples');
  const failed = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.asm'))) {
    const r = assemble(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (!r.ok) failed.push(`${f}: ${r.errors.slice(0, 2).map((e) => `Z${e.line} ${e.message}`).join('; ')}`);
  }
  assert.deepEqual(failed, []);
});

// Funktionstest von Klaus Dormann (GPL v3); Datei nicht im Projekt, Pfad über die Umgebung:
//   DORMANN_BIN=…/6502_functional_test.bin npm test
const dormann = process.env.DORMANN_BIN;
test('Funktionstest von Klaus Dormann', { skip: !dormann }, () => {
  const m = new Machine();
  m.cpu.stopOnBrk = false;
  const bin = fs.readFileSync(dormann);
  m.mem.load(0, bin);
  m.cpu.reset(0x400);
  let last = -1;
  for (let i = 0; i < 100_000_000; i++) {
    const pc = m.cpu.pc;
    if (pc === last) break;
    last = pc;
    m.cpu.step();
    if (m.cpu.halted) break;
  }
  assert.equal(m.cpu.pc.toString(16), '3469', `Fehlerfalle bei $${m.cpu.pc.toString(16)}`);
});

test('Jeder englische Schlüssel existiert auch auf Deutsch und umgekehrt', async () => {
  const { en } = await import('../src/i18n/en.js');
  const { de } = await import('../src/i18n/de.js');
  assert.deepEqual(Object.keys(en).filter((k) => !(k in de)), []);
  assert.deepEqual(Object.keys(de).filter((k) => !(k in en)), []);
  const ph = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
  for (const k of Object.keys(en)) assert.equal(ph(de[k]), ph(en[k]), `Platzhalter in ${k}`);
});

test('Haltepunkte folgen ihrer Marke, wenn sich der Quelltext ändert', async () => {
  const { anchorFor, resolveAnchor } = await import('../src/core/breakpoints.js');
  const v1 = assemble('start: ldx #0\nloop: inx\n  stx $10\n  bne loop\n  brk');
  const bpAddr = v1.lineMap.find((l) => l.line === 3).addr; // stx $10, zwei Bytes hinter loop
  const a = anchorFor(bpAddr, v1.labels);
  assert.deepEqual(a, { label: 'loop', offset: 1 });
  // davor eingefügter Befehl verschiebt alles; Marke bleibt, Haltepunkt wandert mit
  const v2 = assemble('start: ldx #0\n  nop\n  nop\nloop: inx\n  stx $10\n  bne loop\n  brk');
  const valid = new Set(v2.lineMap.map((l) => l.addr));
  assert.equal(resolveAnchor(a, v2.labels, valid), v2.lineMap.find((l) => l.line === 5).addr);
  // Marke entfernt: Haltepunkt entfällt
  const v3 = assemble('start: ldx #0\n  inx\n  stx $10\n  brk');
  assert.equal(resolveAnchor(a, v3.labels), null);
  // ohne Marke davor: feste Adresse
  assert.deepEqual(anchorFor(0x0602, {}), { addr: 0x0602 });
});

test('Suchmuster und Adressen', async () => {
  const { parseSearch, parseAddress } = await import('../src/core/search.js');
  assert.deepEqual(parseSearch('A9 00'), [0xa9, 0]);
  assert.deepEqual(parseSearch('a900'), [0xa9, 0]);
  assert.deepEqual(parseSearch('$a9 ?? 8d'), [0xa9, null, 0x8d]);
  assert.deepEqual(parseSearch('"Hi"'), [72, 105]);
  assert.equal(parseSearch('xyz'), null);
  assert.equal(parseSearch('a'), null);
  assert.equal(parseAddress('$0200'), 0x200);
  assert.equal(parseAddress('ff'), 0xff);
  assert.equal(parseAddress('loop', { loop: 0x604 }), 0x604);
  assert.equal(parseAddress('dead', { dead: 5 }), 5); // Marke vor Hexziffern
  assert.equal(parseAddress('zzz'), null);
});

test('Speichersuche mit Platzhalter, Umbruch und Sprung des Programmzählers', () => {
  const m = new Machine();
  m.mem.load(0x300, [0xa9, 0x01, 0x8d, 0x00, 0x02]);
  assert.equal(m.mem.find([0xa9, null, 0x8d]), 0x300);
  assert.equal(m.mem.find([0xa9, null, 0x8d], 0x301), -1);
  assert.equal(m.mem.find([0xa9, null, 0x8d], 0x301, true), 0x300);
  m.cpu.halted = true;
  m.jumpTo(0x300);
  assert.equal(m.cpu.pc, 0x300);
  assert.equal(m.cpu.halted, false);
});
