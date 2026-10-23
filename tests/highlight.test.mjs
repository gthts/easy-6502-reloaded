import test from 'node:test';
import assert from 'node:assert/strict';
import { highlightLine, highlight } from '../src/ui/highlight.js';

test('Mnemonik, Zahl, Register', () => {
  assert.equal(
    highlightLine('  lda $0200,x'),
    '  <span class="t-kw">lda</span> <span class="t-num">$0200</span><span class="t-op">,</span><span class="t-reg">x</span>',
  );
});

test('Marke, Kommentar, Sprungziel als Name', () => {
  assert.equal(
    highlightLine('loop: bne loop ; weiter'),
    '<span class="t-lbl">loop:</span> <span class="t-kw">bne</span> <span class="t-sym">loop</span> <span class="t-com">; weiter</span>',
  );
});

test('Strichpunkt in Zeichenketten beginnt keinen Kommentar; HTML wird maskiert', () => {
  const h = highlightLine('dcb "a;<b>"');
  assert.ok(!h.includes('t-com'));
  assert.ok(h.includes('&lt;b&gt;'));
  assert.ok(h.includes('t-dir'));
});

test('Konstante, Ursprung, Akkumulator, unmittelbar', () => {
  assert.ok(highlightLine('wert = 3').startsWith('<span class="t-lbl">wert</span>'));
  assert.ok(highlightLine('*= $0600').startsWith('<span class="t-dir">*</span>'));
  assert.ok(highlightLine('asl a').endsWith('<span class="t-reg">a</span>'));
  assert.ok(highlightLine('lda #<ziel').includes('<span class="t-op">#</span>'));
});

test('Ein Wort ist nur an erster Stelle ein Befehl', () => {
  assert.ok(highlightLine('lda nop').endsWith('<span class="t-sym">nop</span>'));
});

test('Zeilenanzahl bleibt erhalten', () => {
  assert.equal(highlight('a\n\nb').length, 3);
  assert.equal(highlight('').length, 1);
});
